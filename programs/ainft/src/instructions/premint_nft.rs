use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::mpl_token_metadata::types::{Collection, Creator, DataV2};
use anchor_spl::metadata::{self, CreateMetadataAccountsV3, Metadata};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use std::mem::size_of;

use crate::events::NFTPreminted;
use crate::state::{AINFTCollection, AiCharacterNFT, AiNft, CharacterConfig};

#[derive(Accounts)]
#[instruction(name: String, uri: String, collection_name: String, price: u64)]
pub struct CreatePremintedNft<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        mut,
        seeds = ["collection".as_bytes(), authority.key().as_ref(), collection_name.as_bytes()],
        bump,
        constraint = collection.authority == authority.key(),
        constraint = collection.mint_count < collection.total_supply,
    )]
    pub collection: Account<'info, AINFTCollection>,

    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<AiCharacterNFT>(),
        seeds = ["ainft".as_bytes(), ai_character_mint.key().as_ref()],
        bump,
    )]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    // The NFT mint
    #[account(
        init,
        payer = authority,
        seeds = ["premint".as_bytes(), collection.key().as_ref(), name.as_bytes()],
        bump,
        mint::decimals = 0,
        mint::authority = collection,
        mint::freeze_authority = collection,
    )]
    pub ai_character_mint: Box<Account<'info, Mint>>,

    /// CHECK: Account allocation and initialization is done via CPI to the metadata program.
    #[account(mut)]
    pub ai_character_metadata: UncheckedAccount<'info>,

    // Collection token account to hold the NFT until purchased
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = ai_character_mint,
        associated_token::authority = collection,
    )]
    pub collection_token_account: Box<Account<'info, TokenAccount>>,

    // Optional character config account
    #[account()]
    pub character_config: Option<UncheckedAccount<'info>>,

    // The collection creator/authority
    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> CreatePremintedNft<'info> {
    pub fn create_metadata_accounts_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, CreateMetadataAccountsV3<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = CreateMetadataAccountsV3 {
            metadata: self.ai_character_metadata.to_account_info(),
            mint: self.ai_character_mint.to_account_info(),
            mint_authority: self.collection.to_account_info(),
            payer: self.authority.to_account_info(),
            update_authority: self.collection.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    pub fn mint_to_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let program = self.token_program.to_account_info();
        let accounts = MintTo {
            mint: self.ai_character_mint.to_account_info(),
            to: self.collection_token_account.to_account_info(),
            authority: self.collection.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }
}

pub fn create_preminted_nft_handler(
    ctx: Context<CreatePremintedNft>,
    name: String,
    uri: String,
    collection_name: String,
    price: u64,
    default_execution_client: Option<Pubkey>,
) -> Result<()> {
    // Create metadata for the NFT
    let seeds = [
        "collection".as_bytes(),
        ctx.accounts.collection.authority.as_ref(),
        collection_name.as_bytes(),
        &[ctx.bumps.collection],
    ];

    // Create the metadata
    msg!("Creating metadata");
    metadata::create_metadata_accounts_v3(
        ctx.accounts
            .create_metadata_accounts_ctx()
            .with_signer(&[&seeds]),
        DataV2 {
            name: name.clone(),
            symbol: "cool".to_string(),
            uri: uri.clone(),
            seller_fee_basis_points: 1000, // 10%
            creators: Some(vec![Creator {
                address: ctx.accounts.collection.authority,
                verified: false,
                share: 100,
            }]),
            collection: Some(Collection {
                verified: false,
                key: ctx.accounts.collection.mint,
            }),
            uses: None,
        },
        true,
        true,
        None,
    )?;

    msg!("Minting NFT");
    // Mint the NFT to the collection's token account
    token::mint_to(ctx.accounts.mint_to_ctx().with_signer(&[&seeds]), 1)?;

    // Update the collection's mint count
    let collection = &mut ctx.accounts.collection;
    collection.increment_mint_count();

    // Store NFT data in the AiCharacterNFT account
    let mut ai_character = ctx.accounts.ai_character.load_init()?;

    // Get the character config pubkey if provided
    let character_config_pubkey = if let Some(character_config) = &ctx.accounts.character_config {
        character_config.key()
    } else {
        Pubkey::default()
    };

    *ai_character = AiCharacterNFT::try_new(
        &ctx.accounts.ai_nft.key(),
        &ctx.accounts.ai_character_mint.key(),
        &name,
        default_execution_client,
        Some(ctx.accounts.collection_token_account.key()),
        &character_config_pubkey,
        ctx.bumps.ai_character,
    );

    // Set the preminted flag and price
    ai_character.is_preminted = true;
    ai_character.is_minted = false;

    // Emit an event for the preminted NFT
    emit!(NFTPreminted {
        collection: collection.key(),
        nft_mint: ctx.accounts.ai_character_mint.key(),
        authority: collection.authority,
        price,
    });

    Ok(())
}
