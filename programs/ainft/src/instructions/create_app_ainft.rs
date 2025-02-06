use std::mem::size_of;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        self,
        mpl_token_metadata::types::{Creator, DataV2},
        SignMetadata, UpdatePrimarySaleHappenedViaToken,
    },
    token::{self, FreezeAccount, MintTo, Token},
};

use anchor_spl::metadata::{CreateMetadataAccountsV3, Metadata};

use crate::events::CollectionCreated;
use crate::{
    error::AiNftError,
    state::{AiNft, CreateAiNftParams},
};

#[derive(Accounts)]
#[instruction(params: CreateAiNftParams)]
pub struct CreateAppAiNft<'info> {
    #[account(
        init,
        payer = payer,
        space = AiNft::LEN,
        seeds = ["app_ainft".as_bytes()],
        bump
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        init,
        payer = payer,
        seeds = [
            "master_mint".as_bytes(),
            ai_nft.key().as_ref(),
        ],
        bump,
        mint::authority = ai_nft,
        mint::freeze_authority = ai_nft,
        mint::decimals = 0,
    )]
    pub master_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        associated_token::authority = payer,
        associated_token::mint = master_mint,
    )]
    pub master_token: Box<Account<'info, TokenAccount>>,

    /// CHECK: Account allocation and initialization is done via CPI to the metadata program.
    #[account(
        mut,
        seeds = [
            "metadata".as_bytes(),
            metadata_program.key().as_ref(),
            master_mint.key().as_ref(),
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CreateAppAiNft<'info> {
    pub fn create_metadata_accounts_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, CreateMetadataAccountsV3<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = CreateMetadataAccountsV3 {
            metadata: self.master_metadata.to_account_info(),
            mint: self.master_mint.to_account_info(),
            mint_authority: self.ai_nft.to_account_info(),
            payer: self.payer.to_account_info(),
            update_authority: self.ai_nft.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    pub fn freeze_account_ctx(&self) -> CpiContext<'_, '_, '_, 'info, FreezeAccount<'info>> {
        let program = self.token_program.to_account_info();
        let accounts = FreezeAccount {
            account: self.master_token.to_account_info(),
            authority: self.ai_nft.to_account_info(),
            mint: self.master_mint.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    pub fn mint_to_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let program = self.token_program.to_account_info();
        let accounts = MintTo {
            mint: self.master_mint.to_account_info(),
            to: self.master_token.to_account_info(),
            authority: self.ai_nft.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    pub fn sign_metadata_ctx(&self) -> CpiContext<'_, '_, '_, 'info, SignMetadata<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = SignMetadata {
            creator: self.payer.to_account_info(),
            metadata: self.master_metadata.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    pub fn update_primary_sale_happened_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, UpdatePrimarySaleHappenedViaToken<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = UpdatePrimarySaleHappenedViaToken {
            metadata: self.master_metadata.to_account_info(),
            owner: self.payer.to_account_info(),
            token: self.master_token.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }
}

pub fn create_app_ainft_handler(
    ctx: Context<CreateAppAiNft>,
    params: CreateAiNftParams,
) -> Result<()> {
    if params.max_supply == 0 {
        return err!(AiNftError::InvalidSupply);
    }

    if params.mint_price == 0 {
        return err!(AiNftError::InvalidMintPrice);
    }
    initialize_master_token(&ctx, &params)?;
    create_and_sign_metadata(&ctx, &params)?;

    let ainft = &mut ctx.accounts.ai_nft;
    ***ainft = AiNft::try_new(
        ctx.bumps.ai_nft,
        ctx.accounts.payer.key(),
        ctx.accounts.master_metadata.key(),
        ctx.accounts.master_mint.key(),
        &params,
    )?;

    emit!(CollectionCreated {
        collection: ainft.key(),
        authority: ainft.authority,
    });

    Ok(())
}

#[inline(never)]
fn initialize_master_token(
    ctx: &Context<CreateAppAiNft>,
    _params: &CreateAiNftParams,
) -> Result<()> {
    let ainft_seeds = &["app_ainft".as_bytes(), &[ctx.bumps.ai_nft]];

    // Mint the master token
    token::mint_to(ctx.accounts.mint_to_ctx().with_signer(&[ainft_seeds]), 1)?;

    // Freeze the token account
    token::freeze_account(
        ctx.accounts
            .freeze_account_ctx()
            .with_signer(&[ainft_seeds]),
    )?;

    Ok(())
}

#[inline(never)]
fn create_and_sign_metadata(
    ctx: &Context<CreateAppAiNft>,
    params: &CreateAiNftParams,
) -> Result<()> {
    let ainft_seeds = &["app_ainft".as_bytes(), &[ctx.bumps.ai_nft]];

    let creator = Creator {
        address: ctx.accounts.payer.key(),
        share: 100,
        verified: false,
    };

    metadata::create_metadata_accounts_v3(
        ctx.accounts
            .create_metadata_accounts_ctx()
            .with_signer(&[ainft_seeds]),
        DataV2 {
            name: params.name.clone(),
            symbol: params.symbol.to_string(),
            uri: params.uri.clone(),
            seller_fee_basis_points: 0,
            creators: Some(vec![creator]),
            collection: None,
            uses: None,
        },
        true, // is_mutable
        true, // update_authority_is_signer
        None,
    )?;

    // Sign metadata and update primary sale
    metadata::sign_metadata(ctx.accounts.sign_metadata_ctx())?;
    metadata::update_primary_sale_happened_via_token(
        ctx.accounts.update_primary_sale_happened_ctx(),
    )?;

    Ok(())
}
