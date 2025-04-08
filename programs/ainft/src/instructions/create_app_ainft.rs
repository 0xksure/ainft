use std::mem::size_of;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        self,
        mpl_token_metadata::types::{Creator, DataV2},
    },
    token::{self, FreezeAccount, MintTo, Token},
};

use crate::events::AINFTAppInitialized;
use crate::{
    error::AiNftError,
    state::{AiNft, CreateAiNftParams},
};

#[derive(Accounts)]
#[instruction(params: CreateAiNftParams)]
pub struct CreateAppAiNft<'info> {
    #[account(
        init,
        payer = payer,
        space = AiNft::LEN,
        seeds = ["app_ainft".as_bytes()],
        bump
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_app_ainft_handler(
    ctx: Context<CreateAppAiNft>,
    params: CreateAiNftParams,
) -> Result<()> {
    let ainft = &mut ctx.accounts.ai_nft;
    ***ainft = AiNft::try_new(ctx.bumps.ai_nft, ctx.accounts.payer.key(), &params)?;

    emit!(AINFTAppInitialized {
        authority: ainft.authority,
    });

    Ok(())
}
