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
        constraint = ai_character.load().unwrap().character_nft_mint == ai_character_mint.key() @ AiNftError::InvalidAgentNftMint,
    )]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    #[account(mut)]
    pub authority: Signer<'info>,

    // the mint of the agent nft
    #[account(
        mut,
        constraint = ai_character_mint.key() == ai_character.load().unwrap().character_nft_mint @ AiNftError::InvalidAgentNftMint,
        constraint = ai_character_mint.mint_authority.is_some() && ai_character_mint.mint_authority.unwrap() == ai_nft.key() @ AiNftError::InvalidMintAuthority,
    )]
    pub ai_character_mint: Account<'info, Mint>,

    // token account of the agent nft
    #[account(
        mut,
        // mint of the token account should be the agent nft mint
        constraint = ai_character_token_account.mint == ai_character_mint.key() @ AiNftError::InvalidAgentNftMint,
        // owner of the token account should be the authority
        constraint = ai_character_token_account.owner == authority.key() @ AiNftError::InvalidOwner,
        constraint = ai_character_token_account.amount == 1 @ AiNftError::InvalidAgentNftTokenAccount,
    
    )]
    pub ai_character_token_account: Account<'info, TokenAccount>,

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
