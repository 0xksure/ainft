use anchor_lang::prelude::*;

use crate::{events::ExecutionClientConfigUpdated, state::ExecutionClient};

#[derive(Accounts)]
pub struct UpdateExecutionClientConfig<'info> {
    #[account(
        mut,
        constraint = execution_client.authority == authority.key(),
    )]
    pub execution_client: Account<'info, ExecutionClient>,

    pub authority: Signer<'info>,
}

pub fn update_execution_client_config_handler(
    ctx: Context<UpdateExecutionClientConfig>,
    new_gas: u64,
) -> Result<()> {
    let execution_client = &mut ctx.accounts.execution_client;

    // Update the fee
    execution_client.update_gas(new_gas)?;

    emit!(ExecutionClientConfigUpdated {
        client: execution_client.key(),
        new_gas,
    });

    Ok(())
}
