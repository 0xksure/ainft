use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::mpl_token_metadata::types::{Collection, DataV2};
use anchor_spl::metadata::{self, CreateMetadataAccountsV3, Metadata};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use std::mem::size_of;
use crate::error::AiNftError;
use crate::state::{AINFTCollection, AiCharacterNFT, AiNft};

// Define a variant for minting from a collection
#[derive(Accounts)]
#[instruction(name: String, uri: String, collection_owner: Pubkey, collection_name: String)]
pub struct MintAiNftFromCollection<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    // Metaplex collection account
    #[account(
        mut,
        seeds = ["collection".as_bytes(), collection_owner.key().as_ref(), collection_name.as_bytes()],
        bump,
    )]
    pub collection: Account<'info, AINFTCollection>,

    #[account(
        init,
        payer = payer,
        space = 8 + size_of::<AiCharacterNFT>(),
        seeds = ["ainft".as_bytes(), ai_character_mint.key().as_ref()],
        bump,
    )]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    // ai character mint
    #[account(  
        init,
        payer = payer,
        seeds = ["mint".as_bytes(), ai_nft.key().as_ref(), name.as_bytes()],
        bump,
        mint::decimals = 0,
        mint::authority = ai_nft,
        mint::freeze_authority = ai_nft,
    )]
    pub ai_character_mint: Box<Account<'info, Mint>>,

    /// CHECK: Account allocation and initialization is done via CPI to the metadata program.
    #[account(mut)]
    pub ai_character_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // payer token account
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = ai_character_mint,
        associated_token::authority = payer,
    )]
    pub payer_ai_character_token_account: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub rent: Sysvar<'info, Rent>,
}

/// Allows the user to mint an nft from the app_ainft
/// collection NFT 
#[derive(Accounts)]
#[instruction(name: String, uri: String,collection_owner: Pubkey,collection_name: String)]
pub struct MintAiNft<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        init,
        payer = payer,
        space = 8 + size_of::<AiCharacterNFT>(),
        seeds = ["ainft".as_bytes(), ai_character_mint.key().as_ref()],
        bump,
    )]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    // ai character mint
    #[account(  
        init,
        payer = payer,
        seeds = ["mint".as_bytes(), ai_nft.key().as_ref(), name.as_bytes()],
        bump,
        mint::decimals = 0,
        mint::authority = ai_nft,
        mint::freeze_authority = ai_nft,
    )]
    pub ai_character_mint: Box<Account<'info, Mint>>,

    /// CHECK: Account allocation and initialization is done via CPI to the metadata program.
    #[account(mut)]
    pub ai_character_metadata: UncheckedAccount<'info>,

    // collection seeds
    #[account(
        mut,
        seeds = ["collection".as_bytes(), collection_owner.key().as_ref(), collection_name.as_bytes()],
        bump,
        constraint = collection.authority == collection_owner,
        constraint = collection.authority == payer.key(),
    )]
    pub collection: Account<'info, AINFTCollection>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // payer token account
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = ai_character_mint,
        associated_token::authority = payer,
    )]
    pub payer_ai_character_token_account: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub rent: Sysvar<'info, Rent>,
}

// Common implementation for both account structures
impl<'info> MintAiNft<'info> {
    pub fn create_metadata_accounts_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, CreateMetadataAccountsV3<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = CreateMetadataAccountsV3 {
            metadata: self.ai_character_metadata.to_account_info(),
            mint: self.ai_character_mint.to_account_info(),
            mint_authority: self.ai_nft.to_account_info(),
            payer: self.payer.to_account_info(),
            update_authority: self.ai_nft.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    pub fn mint_to_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let program = self.token_program.to_account_info();
        let accounts = MintTo {
            mint: self.ai_character_mint.to_account_info(),
            to: self.payer_ai_character_token_account.to_account_info(),
            authority: self.ai_nft.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    #[inline(never)]
    fn process_mint(&self) -> Result<()> {
        // Mint logic
        token::mint_to(
            self.mint_to_ctx().with_signer(&[&self.ai_nft.as_seeds()]), 
            1
        )
    }

    #[inline(never)]
    fn process_metadata(&self, name: &str, uri: &str, collection_mint: Option<Pubkey>) -> Result<()> {
        // Metadata creation logic
        let collection_option = if let Some(mint) = collection_mint {
            Some(Collection {
                verified: false,
                key: mint,
            })
        } else {
            Some(Collection {
                verified: false,
                key: self.ai_nft.master_mint,
            })
        };

        metadata::create_metadata_accounts_v3(
            self.create_metadata_accounts_ctx()
                .with_signer(&[&self.ai_nft.as_seeds()]),
            DataV2 {
                name: name.to_string(),
                symbol: "AINFT".to_string(),
                uri: uri.to_string(),
                seller_fee_basis_points: self.collection.royalty_basis_points,
                creators: None,
                collection: collection_option,
                uses: None,
            },
            true,
            true,
            None,
        )
    }
}

// Same implementation for MintAiNftFromCollection
impl<'info> MintAiNftFromCollection<'info> {
    pub fn create_metadata_accounts_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, CreateMetadataAccountsV3<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = CreateMetadataAccountsV3 {
            metadata: self.ai_character_metadata.to_account_info(),
            mint: self.ai_character_mint.to_account_info(),
            mint_authority: self.ai_nft.to_account_info(),
            payer: self.payer.to_account_info(),
            update_authority: self.ai_nft.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    pub fn mint_to_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let program = self.token_program.to_account_info();
        let accounts = MintTo {
            mint: self.ai_character_mint.to_account_info(),
            to: self.payer_ai_character_token_account.to_account_info(),
            authority: self.ai_nft.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    #[inline(never)]
    fn process_mint(&self) -> Result<()> {
        // Mint logic
        token::mint_to(
            self.mint_to_ctx().with_signer(&[&self.ai_nft.as_seeds()]), 
            1
        )
    }

    #[inline(never)]
    fn process_metadata(&self, name: &str, uri: &str) -> Result<()> {
        // Metadata creation logic with collection
        let collection_option = Some(Collection {
            verified: false,
            key: self.collection.mint,
        });

        metadata::create_metadata_accounts_v3(
            self.create_metadata_accounts_ctx()
                .with_signer(&[&self.ai_nft.as_seeds()]),
            DataV2 {
                name: name.to_string(),
                symbol: "AINFT".to_string(),
                uri: uri.to_string(),
                seller_fee_basis_points: self.collection.royalty_basis_points,
                creators: None,
                collection: collection_option,
                uses: None,
            },
            true,
            true,
            None,
        )
    }
}

// Handler for minting from app_ainft
#[inline(never)]
pub fn mint_ainft_handler(
    ctx: Context<MintAiNft>,
    name: String,
    uri: String,
    collection_owner: Pubkey,
    collection_name: String,
) -> Result<()> {
    // Verify supply
    require!(ctx.accounts.collection.mint_count <= ctx.accounts.collection.total_supply, AiNftError::SupplyExceeded);

    // transfer SOL for mint price
    if ctx.accounts.collection.mint_price > 0 {
        // Transfer SOL for mint price
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.ai_nft.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, ctx.accounts.collection.mint_price as u64)?;
    }

    // Process mint
    ctx.accounts.process_mint()?;

    // Initialize ai character 
    ctx.accounts.ai_character.load_init().unwrap().set(
        &ctx.accounts.ai_nft.master_mint.key(),
        &ctx.accounts.ai_character_mint.key(),
        &name,
        &ctx.accounts.ai_nft.default_execution_client,
        Pubkey::default(),
        ctx.bumps.ai_character,
    );
    
    // Process metadata
    ctx.accounts.process_metadata(&name, &uri, None)?;

    // Increment collection mint count
    ctx.accounts.collection.increment_mint_count();

    Ok(())
}

// Handler for minting from a Metaplex collection
#[inline(never)]
pub fn mint_ainft_from_collection_handler(
    ctx: Context<MintAiNftFromCollection>,
    name: String,
    uri: String,
) -> Result<()> {
  

    // Process mint
    ctx.accounts.process_mint()?;

    // Initialize ai character 
    ctx.accounts.ai_character.load_init().unwrap().set(
        &ctx.accounts.ai_nft.master_mint.key(),
        &ctx.accounts.ai_character_mint.key(),
        &name,
        &ctx.accounts.ai_nft.default_execution_client,
        Pubkey::default(),
        ctx.bumps.ai_character,
    );
    
    // Process metadata
    ctx.accounts.process_metadata(&name, &uri)?;

    // Increment collection total supply
    ctx.accounts.collection.total_supply += 1;

    Ok(())
}
