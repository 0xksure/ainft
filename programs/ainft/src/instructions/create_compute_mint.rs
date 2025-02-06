use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        self,
        mpl_token_metadata::{
            instructions::CreateMetadataAccountV3,
            types::{Collection, DataV2},
        },
        CreateMetadataAccountsV3, Metadata,
    },
    token::{Mint, Token},
};

use crate::{error::AiNftError, state::AiNft};

#[event]
pub struct ComputeMintCreated {
    pub ai_nft: Pubkey,
    pub compute_mint: Pubkey,
}

#[derive(Accounts)]
pub struct CreateComputeMint<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump = ai_nft.bump[0],
        constraint = ai_nft.compute_mint == Pubkey::default() @ AiNftError::ComputeMintNotInitialized,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    /// CHECK: this is a metadata account for the compute mint
    #[account(
        mut,
        seeds = [
            "metadata".as_bytes(),
            metadata_program.key().as_ref(),
            compute_mint.key().as_ref(),
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub compute_mint_metadata: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        seeds = ["compute_mint".as_bytes(), ai_nft.key().as_ref()],
        bump,
        mint::decimals = 9,
        mint::authority = ai_nft,
    )]
    pub compute_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CreateComputeMint<'info> {
    pub fn create_metadata_accounts_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, CreateMetadataAccountsV3<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = CreateMetadataAccountsV3 {
            metadata: self.compute_mint_metadata.to_account_info(),
            mint: self.compute_mint.to_account_info(),
            mint_authority: self.ai_nft.to_account_info(),
            payer: self.payer.to_account_info(),
            update_authority: self.ai_nft.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    #[inline(never)]
    fn process_metadata(&self, name: &str, uri: &str) -> Result<()> {
        // Metadata creation logic
        metadata::create_metadata_accounts_v3(
            self.create_metadata_accounts_ctx()
                .with_signer(&[&self.ai_nft.as_seeds()]),
            DataV2 {
                name: name.to_string(),
                symbol: "AINFT".to_string(),
                uri: uri.to_string(),
                seller_fee_basis_points: 0,
                creators: None,
                collection: None,
                uses: None,
            },
            true,
            true,
            None,
        )
    }
}

pub fn create_compute_mint_handler(ctx: Context<CreateComputeMint>) -> Result<()> {
    // Update the AI NFT with the compute mint
    ctx.accounts.ai_nft.compute_mint = ctx.accounts.compute_mint.key();

    // create metadata account for compute mint
    ctx.accounts
        .process_metadata("Compute Mint", "https://example.com/compute-mint.json")?;

    emit!(ComputeMintCreated {
        ai_nft: ctx.accounts.ai_nft.key(),
        compute_mint: ctx.accounts.compute_mint.key(),
    });

    Ok(())
}
