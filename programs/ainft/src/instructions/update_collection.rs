use anchor_lang::prelude::*;
use anchor_spl::token::Token;

use crate::error::AiNftError;
use crate::events::CollectionUpdated;
use crate::state::AINFTCollection;

#[derive(Accounts)]
#[instruction(collection_name: String)]
pub struct UpdateCollection<'info> {
    #[account(
        mut,
        seeds = ["collection".as_bytes(), authority.key().as_ref(), collection_name.as_bytes()],
        bump = collection.bump[0],
        constraint = collection.authority == authority.key() @ AiNftError::InvalidCollectionAuthority,
        constraint = !collection.preminting_finalized @ AiNftError::PremintingFinalized,
    )]
    pub collection: Account<'info, AINFTCollection>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn update_collection_handler(
    ctx: Context<UpdateCollection>,
    _collection_name: String,
    new_name: Option<String>,
    new_uri: Option<String>,
    new_description: Option<String>,
    new_mint_price: Option<u64>,
    new_start_mint_date: Option<i64>,
    new_end_mint_date: Option<i64>,
) -> Result<()> {
    let collection = &mut ctx.accounts.collection;

    if let Some(name) = new_name {
        collection.update_name(name);
    }

    if let Some(uri) = new_uri {
        collection.update_uri(uri);
    }

    if let Some(description) = new_description {
        collection.update_description(description);
    }

    if let Some(price) = new_mint_price {
        collection.update_mint_price(price);
    }

    // Handle the mint dates
    if new_start_mint_date.is_some() || new_end_mint_date.is_some() {
        let start_date = new_start_mint_date.unwrap_or(collection.start_mint_date);
        let end_date = new_end_mint_date.unwrap_or(collection.end_mint_date);

        // Ensure start date is before end date if end date is set
        if end_date > 0 && start_date >= end_date {
            return Err(AiNftError::InvalidMintDates.into());
        }

        collection.update_mint_dates(start_date, end_date);
    }

    // Emit event
    emit!(CollectionUpdated {
        collection: collection.key(),
        authority: collection.authority,
    });

    Ok(())
}
