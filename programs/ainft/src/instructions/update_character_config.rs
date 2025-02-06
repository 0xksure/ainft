use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

use crate::{
    error::AiNftError,
    state::{AiCharacterNFT, AiNft, CharacterConfig, CharacterConfigInput},
};

#[derive(Accounts)]
pub struct UpdateAiCharacter<'info> {
    // app ai nft account
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
        constraint = authority_ai_character_token_account.mint == ai_character_mint.key() @ AiNftError::InvalidAgentNftMint,
        // owner of the token account should be the authority
        constraint = authority_ai_character_token_account.owner == authority.key() @ AiNftError::InvalidOwner,
       // the token accounts should contain the agent nft
       constraint = authority_ai_character_token_account.amount == 1 @ AiNftError::InvalidAgentNftTokenAccount,
    )]
    pub authority_ai_character_token_account: Account<'info, TokenAccount>,
}

pub fn update_character_config_handler(
    ctx: Context<UpdateAiCharacter>,
    new_config: CharacterConfigInput,
) -> Result<()> {
    ctx.accounts
        .ai_character
        .load_mut()
        .unwrap()
        .update_character_config(new_config)?;

    Ok(())
}
