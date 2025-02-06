use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::{
    error::AiNftError,
    state::{ai_nft, AiNft, ExecutionClient, Staker},
};

#[derive(Accounts)]
pub struct UnstakeCompute<'info> {
    // ai nft is required to transfer from the staked compute pool
    #[account(
        constraint = ai_nft.key() == execution_client.ai_nft @ AiNftError::InvalidAiNft,
    )]
    pub ai_nft: Account<'info, AiNft>,

    #[account(
        mut,
        constraint = execution_client.active @ AiNftError::ExecutionClientNotActive,
        constraint = execution_client.liquid_staking_token_mint == liquid_staking_token_mint.key() @ AiNftError::InvalidStakedMint,
        constraint = execution_client.compute_mint == stake_pool_token_account.mint @ AiNftError::InvalidComputeVault,
    )]
    pub execution_client: Account<'info, ExecutionClient>,

    #[account(mut)]
    pub liquid_staking_token_mint: Box<Account<'info, Mint>>,

    /// the staker account
    #[account(mut)]
    pub staker_account: Account<'info, Staker>,

    // the staked token account is the vault that the stakers have staked their compute tokens in
    #[account(
        mut,
        constraint = stake_pool_token_account.mint == execution_client.compute_mint @ AiNftError::InvalidComputeMint,
    )]
    pub stake_pool_token_account: Account<'info, TokenAccount>,

    // the staker compute account is the token account for the stakers compute tokens
    #[account(
        mut,
        constraint = authority_compute_account.mint == execution_client.compute_mint,
        constraint = authority_compute_account.owner == authority.key() @ AiNftError::InvalidAuthority,
    )]
    pub authority_compute_account: Account<'info, TokenAccount>,

    // the staker staked token account is the token account for the stakers staked tokens
    #[account(
        mut,
        constraint = authority_liquid_staking_token_account.mint == liquid_staking_token_mint.key(),
        constraint = authority_liquid_staking_token_account.owner == authority.key() @ AiNftError::InvalidAuthority,
    )]
    pub authority_liquid_staking_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn unstake_compute_handler(ctx: Context<UnstakeCompute>, staked_amount: u64) -> Result<()> {
    let execution_client = &mut ctx.accounts.execution_client;

    // Calculate compute tokens to return based on current rate
    let compute_amount =
        (staked_amount * execution_client.total_compute) / execution_client.total_staked;

    // Burn staked tokens
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.liquid_staking_token_mint.to_account_info(),
                from: ctx
                    .accounts
                    .authority_liquid_staking_token_account
                    .to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        staked_amount,
    )?;

    // Transfer compute tokens from vault
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.stake_pool_token_account.to_account_info(),
                to: ctx.accounts.authority_compute_account.to_account_info(),
                authority: ctx.accounts.ai_nft.to_account_info(),
            },
            &[&ctx.accounts.ai_nft.as_seeds()],
        ),
        compute_amount,
    )?;

    // Update state
    execution_client.total_compute -= compute_amount;
    execution_client.total_staked -= staked_amount;

    // update staker account
    ctx.accounts.staker_account.unstake_compute(staked_amount);

    Ok(())
}
