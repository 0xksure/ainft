use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount},
};

use crate::{
    error::AiNftError,
    state::{AiCharacterNFT, AiNft},
};

#[event]
pub struct AiCharacterComputeAccountCreated {
    pub ai_character: Pubkey,
    pub compute_token_account: Pubkey,
}

#[derive(Accounts)]
pub struct CreateAiCharacterComputeAccount<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump = ai_nft.bump[0],
        constraint = ai_nft.compute_mint != Pubkey::default() @ AiNftError::ComputeMintNotInitialized
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(mut)]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    /// The compute mint of the AI NFT
    /// CHECK: Verified through ai_nft account constraint
    #[account(
        constraint = compute_mint.key() == ai_nft.compute_mint @ AiNftError::InvalidComputeMint
    )]
    pub compute_mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = compute_mint,
        associated_token::authority = ai_character,
    )]
    pub ai_character_compute_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_ai_character_compute_account_handler(
    ctx: Context<CreateAiCharacterComputeAccount>,
) -> Result<()> {
    // Load the account first
    let ai_character = &mut ctx.accounts.ai_character.load_mut()?;

    ai_character.compute_token_account = ctx.accounts.ai_character_compute_token_account.key();

    emit!(AiCharacterComputeAccountCreated {
        ai_character: ctx.accounts.ai_character.key(),
        compute_token_account: ctx.accounts.ai_character_compute_token_account.key(),
    });

    Ok(())
}
