use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount},
};

use crate::{
    error::AiNftError,
    state::{AiNft, ExecutionClient, Staker},
};

#[event]
pub struct StakeAccountCreated {
    pub authority: Pubkey,
    pub execution_client: Pubkey,
    pub staker: Pubkey,
}

#[derive(Accounts)]
pub struct CreateStakeAccount<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump = ai_nft.bump[0],
        constraint = ai_nft.compute_mint != Pubkey::default() @ AiNftError::ComputeMintNotInitialized
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        mut,
        seeds = ["execution_client".as_bytes(), ai_nft.key().as_ref(), execution_client.authority.as_ref()],
        bump,
        constraint = execution_client.active @ AiNftError::ExecutionClientNotActive
    )]
    pub execution_client: Box<Account<'info, ExecutionClient>>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<Staker>(),
        seeds = ["staker".as_bytes(), execution_client.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub staker: Box<Account<'info, Staker>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = compute_mint,
        associated_token::authority = authority,
    )]
    pub staker_token_account: Box<Account<'info, TokenAccount>>,

    /// The compute mint of the AI NFT
    /// CHECK: Verified through ai_nft account constraint
    pub compute_mint: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_stake_account_handler(ctx: Context<CreateStakeAccount>) -> Result<()> {
    // Initialize the staker account
    let staker = &mut ctx.accounts.staker;
    ***staker = Staker::new(
        ctx.accounts.authority.key(),
        ctx.accounts.execution_client.key(),
        0, // Initial staked amount is 0
        ctx.bumps.staker,
    );

    // Emit the creation event
    emit!(StakeAccountCreated {
        authority: ctx.accounts.authority.key(),
        execution_client: ctx.accounts.execution_client.key(),
        staker: ctx.accounts.staker.key(),
    });

    Ok(())
}
