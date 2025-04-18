use anchor_lang::prelude::*;
use anchor_spl::token::Token;

use crate::error::AiNftError;
use crate::events::PremintingFinalized;
use crate::state::AINFTCollection;

#[derive(Accounts)]
#[instruction(collection_name: String)]
pub struct FinalizePreminting<'info> {
    #[account(
        mut,
        seeds = ["collection".as_bytes(), authority.key().as_ref(), collection_name.as_bytes()],
        bump = collection.bump[0],
        constraint = collection.authority == authority.key() @ AiNftError::InvalidCollectionAuthority,
    )]
    pub collection: Account<'info, AINFTCollection>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn finalize_preminting_handler(
    ctx: Context<FinalizePreminting>,
    collection_name: String,
) -> Result<()> {
    // Get the collection account
    let collection = &mut ctx.accounts.collection;

    // Set a flag in the collection indicating preminting is finalized
    collection.preminting_finalized = true;

    // Emit an event
    emit!(PremintingFinalized {
        collection: collection.key(),
        authority: collection.authority,
        total_minted: collection.mint_count,
    });

    msg!("Preminting finalized for collection {}", collection_name);
    msg!("Total minted: {}", collection.mint_count);

    Ok(())
}
