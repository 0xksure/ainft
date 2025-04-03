use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::{error::AiNftError, state::AiNft};

#[event]
pub struct ExternalComputeMintSet {
    pub ai_nft: Pubkey,
    pub compute_mint: Pubkey,
}

#[derive(Accounts)]
pub struct SetExternalComputeMint<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump = ai_nft.bump[0],
        has_one = authority,
        constraint = ai_nft.compute_mint == Pubkey::default() @ AiNftError::ComputeMintAlreadyInitialized,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    /// The externally created mint that will be used as the compute token
    pub external_compute_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = authority.key() == ai_nft.authority @ AiNftError::InvalidAuthority
    )]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn set_external_compute_mint_handler(ctx: Context<SetExternalComputeMint>) -> Result<()> {
    // Update the AI NFT with the external compute mint
    ctx.accounts.ai_nft.set_compute_mint(ctx.accounts.external_compute_mint.key());

    emit!(ExternalComputeMintSet {
        ai_nft: ctx.accounts.ai_nft.key(),
        compute_mint: ctx.accounts.external_compute_mint.key(),
    });

    Ok(())
}
