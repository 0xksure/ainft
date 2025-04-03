use anchor_lang::prelude::*;
use anchor_spl::metadata::{
    self,
    mpl_token_metadata::types::{Creator, DataV2},
    CreateMetadataAccountsV3, Metadata,
};
use anchor_spl::token::{Mint, Token};

use crate::events::CollectionCreated;
use crate::state::AINFTCollection;

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String)]
pub struct CreateCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = AINFTCollection::LEN,
        seeds = ["collection".as_bytes(), authority.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub collection: Account<'info, AINFTCollection>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = collection,
        mint::freeze_authority = collection,
    )]
    pub collection_mint: Account<'info, Mint>,

    /// CHECK: Account allocation and initialization is done via CPI to the metadata program.
    #[account(
        mut,
        seeds = [
            "metadata".as_bytes(),
            metadata_program.key().as_ref(),
            collection_mint.key().as_ref(),
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub collection_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CreateCollection<'info> {
    pub fn create_metadata_accounts_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, CreateMetadataAccountsV3<'info>> {
        let program = self.metadata_program.to_account_info();
        let accounts = CreateMetadataAccountsV3 {
            metadata: self.collection_metadata.to_account_info(),
            mint: self.collection_mint.to_account_info(),
            mint_authority: self.collection.to_account_info(),
            payer: self.authority.to_account_info(),
            update_authority: self.collection.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }
}

pub fn create_collection_handler(
    ctx: Context<CreateCollection>,
    name: String,
    symbol: String,
    uri: String,
    royalty_basis_points: u16,
    mint_price: u64,
    total_supply: u64,
) -> Result<()> {
    // Initialize collection account

    // Store the seeds before releasing the mutable borrow
    let authority = ctx.accounts.authority.key();
    let seeds = [
        "collection".as_bytes(),
        authority.as_ref(),
        name.as_bytes(),
        &[ctx.bumps.collection],
    ];
    let creator = Creator {
        address: ctx.accounts.authority.key(),
        share: 100,
        verified: false,
    };

    metadata::create_metadata_accounts_v3(
        ctx.accounts
            .create_metadata_accounts_ctx()
            .with_signer(&[&seeds]),
        DataV2 {
            name: name.clone(),
            symbol: symbol.clone(),
            uri: uri.clone(),
            seller_fee_basis_points: royalty_basis_points,
            creators: Some(vec![creator]),
            collection: None,
            uses: None,
        },
        true,
        true,
        None,
    )?;

    let collection = &mut ctx.accounts.collection;
    **collection = AINFTCollection::try_new(
        authority,
        ctx.accounts.collection_mint.key(),
        name.clone(),
        symbol.clone(),
        uri.clone(),
        royalty_basis_points,
        mint_price,
        total_supply,
        ctx.bumps.collection,
    );

    emit!(CollectionCreated {
        collection: collection.key(),
        authority: collection.authority,
    });

    Ok(())
}
