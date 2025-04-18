use anchor_lang::prelude::*;

use crate::error::AiNftError;
use crate::events::CollectionWhitelistUpdated;
use crate::state::AINFTCollection;

#[derive(Accounts)]
#[instruction(collection_name: String)]
pub struct UpdateCollectionWhitelist<'info> {
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

// Action enum for add/remove operations
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum WhitelistAction {
    Add,
    Remove,
}

pub fn update_collection_whitelist_handler(
    ctx: Context<UpdateCollectionWhitelist>,
    collection_name: String,
    wallet: Pubkey,
    action: WhitelistAction,
) -> Result<()> {
    let collection = &mut ctx.accounts.collection;

    match action {
        WhitelistAction::Add => {
            collection.add_to_whitelist(wallet)?;
        }
        WhitelistAction::Remove => {
            collection.remove_from_whitelist(&wallet)?;
        }
    }

    // Emit event
    emit!(CollectionWhitelistUpdated {
        collection: collection.key(),
        authority: collection.authority,
        wallet,
        action: match action {
            WhitelistAction::Add => 0,    // 0 for add
            WhitelistAction::Remove => 1, // 1 for remove
        },
    });

    Ok(())
}

// Clear the entire whitelist
pub fn clear_collection_whitelist_handler(
    ctx: Context<UpdateCollectionWhitelist>,
    collection_name: String,
) -> Result<()> {
    let collection = &mut ctx.accounts.collection;

    // Clear whitelist
    collection.whitelist.clear();

    // Emit event
    emit!(CollectionWhitelistUpdated {
        collection: collection.key(),
        authority: collection.authority,
        wallet: Pubkey::default(), // Default pubkey since we're clearing all
        action: 2,                 // 2 for clear all
    });

    Ok(())
}
