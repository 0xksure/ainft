use std::mem::size_of;

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::{
    error::AiNftError,
    events::MessageSent,
    state::{AiCharacterNFT, AiNft, MessageAiCharacter},
};

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + size_of::<MessageAiCharacter>(),
        seeds = [
            b"message",
            ai_nft.key().as_ref(),
            ai_character.key().as_ref(),
            ai_character.load().unwrap().message_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub message: Account<'info, MessageAiCharacter>,

    #[account(mut)]
    pub ai_nft: Account<'info, AiNft>,

    // the ai character that receives the message
    #[account(mut)]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    #[account(
        mut,
        constraint = compute_token.mint == ai_nft.compute_mint @ AiNftError::InvalidComputeMint,
        constraint = compute_token.owner == ai_character.key() @ AiNftError::InvalidTokenOwner,
    )]
    pub compute_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn send_message_handler(ctx: Context<SendMessage>, content: String) -> Result<()> {
    let message = &mut ctx.accounts.message;
    let ai_nft = &mut ctx.accounts.ai_nft;
    let ai_character = &mut ctx.accounts.ai_character.load_mut().unwrap();

    // Verify compute token balance
    if ctx.accounts.compute_token.amount < 1 {
        return err!(AiNftError::InsufficientCompute);
    }

    // Create the message
    **message = MessageAiCharacter::new(
        &ai_nft.key(),
        &ctx.accounts.ai_character.key(),
        &ctx.accounts.sender.key(),
        &content,
        ctx.bumps.message,
    );

    // Increment the message counter
    let mut message_count = ai_character.message_count;
    message_count += 1;
    ai_character.update_message_count(message_count);

    emit!(MessageSent {
        ai_nft: ai_nft.key(),
        message: message.key(),
        sender: ctx.accounts.sender.key(),
    });

    Ok(())
}
