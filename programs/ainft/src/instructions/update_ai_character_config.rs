use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::{
    error::AiNftError,
    state::{AiCharacterNFT, CharacterConfig},
};

#[derive(Accounts)]
pub struct UpdateAiCharacterConfig<'info> {
    // The AI character account to update
    #[account(
        mut,
        constraint = ai_character.load().unwrap().character_nft_mint == ai_character_token_account.mint @ AiNftError::InvalidAgentNftMint,
    )]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    // The new character config to associate with the AI character
    #[account(
        constraint = new_character_config.load().unwrap().authority == authority.key() @ AiNftError::InvalidOwner,
    )]
    pub new_character_config: AccountLoader<'info, CharacterConfig>,

    // The owner of the AI character NFT
    #[account(mut)]
    pub authority: Signer<'info>,

    // The token account holding the AI character NFT
    #[account(
        constraint = ai_character_token_account.owner == authority.key() @ AiNftError::InvalidOwner,
        constraint = ai_character_token_account.amount == 1 @ AiNftError::InvalidAgentNftTokenAccount,
    )]
    pub ai_character_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

pub fn update_ai_character_config_handler(
    ctx: Context<UpdateAiCharacterConfig>,
) -> Result<()> {
    // Load the AI character account
    let mut ai_character = ctx.accounts.ai_character.load_mut()?;
    
    // Update the character config reference
    ai_character.character_config_pubkey = ctx.accounts.new_character_config.key();
    
    // Emit an event for the update
    emit!(AiCharacterConfigUpdated {
        ai_character: ctx.accounts.ai_character.key(),
        character_config: ctx.accounts.new_character_config.key(),
        authority: ctx.accounts.authority.key(),
    });
    
    Ok(())
}

// Event emitted when an AI character's config is updated
#[event]
pub struct AiCharacterConfigUpdated {
    pub ai_character: Pubkey,
    pub character_config: Pubkey,
    pub authority: Pubkey,
}
