use crate::{
    error::AiNftError,
    state::{AiCharacterNFT, AiNft, CharacterConfig, StyleConfigInput},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{spl_token::instruction, Mint, TokenAccount};

#[derive(Accounts)]
#[instruction(id: String)]
pub struct UpdateCharacterConfigField<'info> {
    // app ai nft account
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump,
    )]
    pub ai_nft: Account<'info, AiNft>,

    #[account(
        mut,
        seeds = ["character_config".as_bytes(), authority.key().as_ref(), id.as_bytes()],
        bump,
    )]
    pub character_config: AccountLoader<'info, CharacterConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn update_character_name_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    name: String,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_name(name);
    Ok(())
}

pub fn update_character_clients_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    clients: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_clients(clients);
    Ok(())
}

pub fn update_character_model_provider_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    provider: String,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_model_provider(provider);
    Ok(())
}

pub fn update_character_voice_settings_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    model: [u8; 32],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_voice_settings(model);
    Ok(())
}

pub fn update_character_bio_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    bio: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_bio(bio);
    Ok(())
}

pub fn update_character_lore_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    lore: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_lore(lore);
    Ok(())
}

pub fn update_character_knowledge_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    knowledge: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_knowledge(knowledge);
    Ok(())
}

pub fn update_character_topics_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    topics: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_topics(topics);
    Ok(())
}

pub fn update_character_style_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    style: StyleConfigInput,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style(style);
    Ok(())
}

pub fn update_character_adjectives_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    adjectives: Vec<String>,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_adjectives(adjectives);
    Ok(())
}

pub fn update_character_style_all_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    style_all: [[u8; 32]; 5],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style_all(style_all);
    Ok(())
}

pub fn update_character_style_chat_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    style_chat: [[u8; 32]; 5],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style_chat(style_chat);
    Ok(())
}

pub fn update_character_style_post_handler(
    ctx: Context<UpdateCharacterConfigField>,
    id: String,
    style_post: [[u8; 32]; 5],
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_mut()?;
    character_config.update_style_post(style_post);
    Ok(())
}
