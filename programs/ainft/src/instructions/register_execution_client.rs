use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::{
    error::AiNftError,
    state::{AiNft, ExecutionClient},
};

#[event]
pub struct ExecutionClientRegistered {
    pub authority: Pubkey,
    pub execution_client: Pubkey,
    pub gas: u64,
    pub stake: u64,
    pub supported_message_types: Vec<String>,
}

#[derive(Accounts)]
#[instruction(
    gas: u64,
    supported_message_types: Vec<String>,
    staker_fee_share: u8,
)]
pub struct RegisterExecutionClient<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump = ai_nft.bump[0],
        constraint = ai_nft.compute_mint != Pubkey::default() @ AiNftError::ComputeMintNotInitialized
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        init,
        payer = signer,
        space = 8 + std::mem::size_of::<ExecutionClient>(),
        seeds = ["execution_client".as_bytes(), ai_nft.key().as_ref(), signer.key().as_ref()],
        bump,
    )]
    pub execution_client: Box<Account<'info, ExecutionClient>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = compute_mint,
        associated_token::authority = execution_client,
    )]
    pub compute_token_account: Box<Account<'info, TokenAccount>>,

    // create vault for stakers that the app ai nft controls
    // this is were the stakers stake their compute tokens
    // and the execution client has not access to the tokens
    #[account(
        init,
        payer = signer,
        associated_token::mint = compute_mint,
        associated_token::authority = ai_nft,
    )]
    pub staked_token_account: Box<Account<'info, TokenAccount>>,

    /// The compute mint of the AI NFT
    /// CHECK: Verified through ai_nft account constraint
    pub compute_mint: UncheckedAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,

    #[account(
        init,
        payer = signer,
        seeds = ["staked_mint".as_bytes(), ai_nft.key().as_ref(), execution_client.key().as_ref()],
        bump,
        mint::decimals = 9,
        mint::authority = execution_client,
    )]
    pub staked_mint: Box<Account<'info, Mint>>,
}

pub fn register_execution_client_handler(
    ctx: Context<RegisterExecutionClient>,
    gas: u64,
    supported_message_types: Vec<String>,
    staker_fee_share: u8,
    execution_client_bump: u8,
) -> Result<()> {
    require!(staker_fee_share <= 100, AiNftError::InvalidFeeShare);

    require!(
        execution_client_bump != 0,
        AiNftError::InvalidExecutionClientBump
    );
    let execution_client = &mut ctx.accounts.execution_client;

    execution_client.set(
        ctx.accounts.ai_nft.key(),
        ctx.accounts.signer.key(),
        gas,
        ctx.accounts.compute_mint.key(),
        execution_client_bump,
        supported_message_types.clone(),
        ctx.accounts.staked_mint.key(),
        ctx.accounts.staked_token_account.key(),
        ctx.accounts.compute_token_account.key(),
        staker_fee_share,
    )?;

    Ok(())
}
