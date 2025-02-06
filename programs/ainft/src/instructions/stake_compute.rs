use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};

use crate::{
    error::AiNftError,
    state::{AiNft, ExecutionClient, Staker},
};

#[derive(Accounts)]
pub struct StakeCompute<'info> {
    // nclude ai_nft account
    #[account(mut)]
    pub ai_nft: Account<'info, AiNft>,

    #[account(
        mut,
        seeds = ["execution_client".as_bytes(), ai_nft.key().as_ref(), authority.key().as_ref()],
        bump = execution_client.bump[0],
        constraint = execution_client.active @ AiNftError::ExecutionClientNotActive,
        constraint = execution_client.liquid_staking_token_mint == liquid_staking_token_mint.key() @ AiNftError::InvalidStakedMint,
        constraint = execution_client.stake_pool_token_account == stake_pool_token_account.key() @ AiNftError::InvalidComputeVault,
    )]
    pub execution_client: Account<'info, ExecutionClient>,

    #[account(
        mut,
        constraint = stake_pool_token_account.mint == execution_client.compute_mint @ AiNftError::InvalidComputeMint,
    )]
    pub stake_pool_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = liquid_staking_token_mint.mint_authority.is_some() && liquid_staking_token_mint.mint_authority.unwrap() == execution_client.key() @ AiNftError::InvalidLiquidStakingMint,
    )]
    pub liquid_staking_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = authority_compute_account.mint == execution_client.compute_mint,
        constraint = authority_compute_account.owner == authority.key(),
    )]
    pub authority_compute_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = liquid_staking_token_mint,
        associated_token::authority = authority,
    )]
    pub authority_liquid_staking_token_account: Account<'info, TokenAccount>,

    /// pass staker account
    #[account(
        mut,
        constraint = staker_account.authority == authority.key() @ AiNftError::InvalidStaker,
    )]
    pub staker_account: Account<'info, Staker>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn stake_compute_handler(ctx: Context<StakeCompute>, amount: u64) -> Result<()> {
    let execution_client = &mut ctx.accounts.execution_client;

    // Calculate staked tokens to mint based on current rate
    let staked_amount = if execution_client.total_staked == 0 {
        // Initial stake 1:1
        amount
    } else {
        // Calculate based on current ratio
        (amount * execution_client.total_staked) / execution_client.total_compute
    };

    // Transfer compute tokens to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.authority_compute_account.to_account_info(),
                to: ctx.accounts.stake_pool_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    // Mint staked tokens to staker
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.liquid_staking_token_mint.to_account_info(),
                to: ctx
                    .accounts
                    .authority_liquid_staking_token_account
                    .to_account_info(),
                authority: execution_client.to_account_info(),
            },
            &[&execution_client.seeds()],
        ),
        staked_amount,
    )?;

    // Update state
    execution_client.total_compute += amount;
    execution_client.total_staked += staked_amount;

    // Update staker account
    ctx.accounts
        .staker_account
        .update_staked_amount(staked_amount);

    Ok(())
}
