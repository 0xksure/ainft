use crate::actions::{Action, ActionParams};
use crate::error::AiNftError;
use crate::events::ResponseWritten;
use crate::state::{
    ai_nft, execution_client, AiCharacterNFT, AiNft, ExecutionClient, MessageAiCharacter,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::solana_program::stake;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct WriteResponse<'info> {

    // Message account where the message and response are stored
    #[account(
        mut,
        constraint = message.ai_character == ai_character_nft.key(), 
    )]
    pub message: Account<'info, MessageAiCharacter>,

    // The ai nft program account 
    #[account(
        constraint = ai_nft.key() == execution_client.ai_nft @ AiNftError::InvalidAiNft,
    )]
    pub ai_nft: Account<'info, AiNft>,


    // The ai character nft account that the message is for
    #[account(mut)]
    pub ai_character_nft: AccountLoader<'info, AiCharacterNFT>,

    // The ai character compute token account. When the
    // response is written, the compute tokens are transferred to the execution client
    #[account(mut)]
    pub ai_character_compute_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = staked_token_account.mint == execution_client.compute_mint @ AiNftError::InvalidComputeMint,
    )]
    pub staked_token_account: Account<'info, TokenAccount>,


    // The execution client account that will execute the response
    #[account(
        constraint = execution_client.authority == authority.key() @ AiNftError::InvalidAuthority,
        constraint = execution_client.active == true @ AiNftError::ExecutionClientNotActive,
        constraint = ai_character_nft.load().unwrap().execution_client == execution_client.key() @ AiNftError::InvalidExecutionClient,
    )]
    pub execution_client: Account<'info, ExecutionClient>,

    // The compute mint that the AI uses to pay for execution
    #[account(
        constraint = execution_client.compute_mint == compute_mint.key(),
    )]
    pub compute_mint: Account<'info, Mint>,

    // The execution client compute token address
    #[account(
        mut,
        constraint = execution_client.compute_token_address == execution_client_compute_token_address.key(),
        constraint = execution_client_compute_token_address.mint == compute_mint.key(),
    )]
    pub execution_client_compute_token_address: Account<'info, TokenAccount>,


    // The signer of the transaction which is the execution client authority
    #[account(mut)]
    pub authority: Signer<'info>,

    // Action-specific accounts
    /// CHECK: Account validation done in action handlers
    #[account(mut)]
    pub token_a_account: Option<AccountInfo<'info>>,
    /// CHECK: Account validation done in action handlers
    #[account(mut)]
    pub token_b_account: Option<AccountInfo<'info>>,
    /// CHECK: Account validation done in action handlers
    #[account(mut)]
    pub pool_program: Option<AccountInfo<'info>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ResponseWithActions {
    pub content: String,
    pub actions: Vec<ActionParams>,
}



// The execution client writes a response to the ai character
// it also transfers compute tokens to the execution client2
pub fn write_response_handler(ctx: Context<WriteResponse>, response: ResponseWithActions) -> Result<()> {
    // Load the account once at the beginning
    let (character_nft_mint, ai_character_bump) = {
        let mut ai_character_nft = ctx.accounts.ai_character_nft.load_mut()?;
        ai_character_nft.total_processed += 1;
        (ai_character_nft.character_nft_mint, ai_character_nft.bump)
    };
    // Get the seeds once
    let ai_character_seeds = &[
        "ainft".as_bytes(),
        character_nft_mint.as_ref(),
        &ai_character_bump,
    ];
    
    // Calculate fee split
    let fee_split = ctx.accounts.execution_client.calculate_fee_split();

    msg!("fee_split: {:?}", fee_split);
    // Transfer staker portion
    if fee_split.0 > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.ai_character_compute_token_account.to_account_info(),
                    to: ctx.accounts.staked_token_account.to_account_info(),
                    authority: ctx.accounts.ai_character_nft.to_account_info(),
                },
                &[ai_character_seeds],
            ),
            fee_split.0,
        )?;
    }

    // Transfer client portion
    if fee_split.1 > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.ai_character_compute_token_account.to_account_info(),
                    to: ctx.accounts.execution_client_compute_token_address.to_account_info(),
                    authority: ctx.accounts.ai_character_nft.to_account_info(),
                },
                &[ai_character_seeds],
            ),
            fee_split.1,
        )?;
    }

    // Update state
    ctx.accounts.execution_client.add_fees(fee_split.0);
    ctx.accounts.execution_client.total_processed += 1;
    ctx.accounts.message.response = Some(response.content);

    Ok(())
}


