use crate::state::AiNft;
use crate::{
    error::AiNftError,
    state::{AiCharacterNFT, ExecutionClient},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
#[event]
pub struct ExecutionClientUpdated {
    pub ai_character: Pubkey,
    pub new_execution_client: Pubkey,
}

#[derive(Accounts)]
pub struct UpdateAiCharacterExecutionClient<'info> {
    #[account(mut)]
    pub ai_nft: Account<'info, AiNft>,

    #[account(
        mut,
        // make sure the ai character is associated with the agent nft mint
    )]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = execution_client.active @ AiNftError::ExecutionClientNotActive,
    )]
    pub execution_client: Account<'info, ExecutionClient>,
}

pub fn update_ai_character_execution_client_handler(
    ctx: Context<UpdateAiCharacterExecutionClient>,
) -> Result<()> {
    let ai_character = &mut ctx.accounts.ai_character.load_mut().unwrap();
    // Update the execution client
    ai_character.update_execution_client(ctx.accounts.execution_client.key());

    emit!(ExecutionClientUpdated {
        ai_character: ctx.accounts.ai_character.key(),
        new_execution_client: ctx.accounts.execution_client.key(),
    });

    Ok(())
}
