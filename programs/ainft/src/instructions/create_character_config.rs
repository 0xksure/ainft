use anchor_lang::prelude::*;

use crate::{
    error::AiNftError,
    state::{AiNft, CharacterConfig, CharacterConfigInput},
};

#[derive(Accounts)]
#[instruction(config_input: CharacterConfigInput)]
pub struct CreateCharacterConfig<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<CharacterConfig>(),
        seeds = ["character_config".as_bytes(), authority.key().as_ref(), config_input.name.as_bytes()],
        bump,
    )]
    pub character_config: AccountLoader<'info, CharacterConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_character_config_handler(
    ctx: Context<CreateCharacterConfig>,
    config_input: CharacterConfigInput,
) -> Result<()> {
    let mut character_config = ctx.accounts.character_config.load_init()?;
    
    // Initialize the character config with the provided input
    *character_config = CharacterConfig::from_input(
        config_input,
        &ctx.accounts.authority.key(),
        ctx.bumps.character_config,
    );

    // Emit an event for the created character config
    emit!(CharacterConfigCreated {
        character_config: ctx.accounts.character_config.key(),
        authority: ctx.accounts.authority.key(),
    });

    Ok(())
}

// Event emitted when a character config is created
#[event]
pub struct CharacterConfigCreated {
    pub character_config: Pubkey,
    pub authority: Pubkey,
}
