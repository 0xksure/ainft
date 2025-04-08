use crate::{
    error::AiNftError,
    state::{AiCharacterNFT, AiNft, CharacterConfig, StyleConfigInput},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct UpdateCharacterConfigField<'info> {
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
    pub character_config: AccountLoader<'info, CharacterConfig>,

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

pub fn update_character_name_handler(
    ctx: Context<UpdateCharacterConfigField>,
    name: String,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_name(name);
    Ok(())
}

pub fn update_character_clients_handler(
    ctx: Context<UpdateCharacterConfigField>,
    clients: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_clients(clients);
    Ok(())
}

pub fn update_character_model_provider_handler(
    ctx: Context<UpdateCharacterConfigField>,
    provider: String,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_model_provider(provider);
    Ok(())
}

pub fn update_character_voice_settings_handler(
    ctx: Context<UpdateCharacterConfigField>,
    model: [u8; 32],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_voice_settings(model);
    Ok(())
}

pub fn update_character_bio_handler(
    ctx: Context<UpdateCharacterConfigField>,
    bio: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_bio(bio);
    Ok(())
}

pub fn update_character_lore_handler(
    ctx: Context<UpdateCharacterConfigField>,
    lore: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_lore(lore);
    Ok(())
}

pub fn update_character_knowledge_handler(
    ctx: Context<UpdateCharacterConfigField>,
    knowledge: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_knowledge(knowledge);
    Ok(())
}

pub fn update_character_topics_handler(
    ctx: Context<UpdateCharacterConfigField>,
    topics: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_topics(topics);
    Ok(())
}

pub fn update_character_style_handler(
    ctx: Context<UpdateCharacterConfigField>,
    style: StyleConfigInput,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style(style);
    Ok(())
}

pub fn update_character_adjectives_handler(
    ctx: Context<UpdateCharacterConfigField>,
    adjectives: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_adjectives(adjectives);
    Ok(())
}

pub fn update_character_style_all_handler(
    ctx: Context<UpdateCharacterConfigField>,
    style_all: [[u8; 32]; 5],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style_all(style_all);
    Ok(())
}

pub fn update_character_style_chat_handler(
    ctx: Context<UpdateCharacterConfigField>,
    style_chat: [[u8; 32]; 5],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style_chat(style_chat);
    Ok(())
}

pub fn update_character_style_post_handler(
    ctx: Context<UpdateCharacterConfigField>,
    style_post: [[u8; 32]; 5],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style_post(style_post);
    Ok(())
}
