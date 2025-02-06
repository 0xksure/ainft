use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

use crate::{error::AiNftError, state::AiNft};

#[event]
pub struct ComputeTokensMinted {
    pub ai_nft: Pubkey,
    pub amount: u64,
    pub destination: Pubkey,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MintCompute<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump = ai_nft.bump[0],
        has_one = authority,
        constraint = ai_nft.compute_mint != Pubkey::default() @ AiNftError::ComputeMintNotInitialized,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        mut,
        seeds = ["compute_mint".as_bytes(), ai_nft.key().as_ref()],
        bump,
    )]
    pub compute_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = compute_mint,
        associated_token::authority = destination_user,
    )]
    pub recipient_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Can be any valid pubkey
    #[account(mut)]
    pub destination_user: AccountInfo<'info>,

    #[account(
        mut,
        constraint = authority.key() == ai_nft.authority @ AiNftError::InvalidAuthority
    )]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> MintCompute<'info> {
    pub fn mint_to_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let program = self.token_program.to_account_info();
        let accounts = MintTo {
            mint: self.compute_mint.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.ai_nft.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }
}

pub fn mint_compute_handler(ctx: Context<MintCompute>, amount: u64) -> Result<()> {
    // Get the PDA signer seeds
    let ai_nft = &ctx.accounts.ai_nft;
    let seeds = &ai_nft.as_seeds();
    let signer_seeds = &[&seeds[..]];

    // Mint compute tokens to the destination
    token::mint_to(ctx.accounts.mint_to_ctx().with_signer(signer_seeds), amount)?;

    // Emit event
    emit!(ComputeTokensMinted {
        ai_nft: ctx.accounts.ai_nft.key(),
        amount,
        destination: ctx.accounts.recipient_token_account.key(),
    });

    Ok(())
}
