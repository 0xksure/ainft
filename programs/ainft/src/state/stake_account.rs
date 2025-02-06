use anchor_lang::prelude::Pubkey;
use anchor_lang::prelude::*;

// Staker is the account that is used to stake compute tokens to the execution client
#[account]
pub struct Staker {
    pub authority: Pubkey,
    pub execution_client: Pubkey,
    pub amount: u64,
    pub last_stake_epoch: u64,
    pub unstaking_epoch: Option<u64>,
    pub total_rewards_claimed: u64,
    pub bump: u8,
}
impl Staker {
    pub fn new(authority: Pubkey, execution_client: Pubkey, amount: u64, bump: u8) -> Self {
        Self {
            authority,
            execution_client,
            amount,
            last_stake_epoch: Clock::get().unwrap().epoch,
            unstaking_epoch: None,
            total_rewards_claimed: 0,
            bump,
        }
    }

    pub fn update_staked_amount(&mut self, amount: u64) {
        self.amount += amount;
        self.last_stake_epoch = Clock::get().unwrap().epoch;
    }

    // unstake compute tokens
    pub fn unstake_compute(&mut self, amount: u64) {
        self.amount -= amount;
        self.last_stake_epoch = Clock::get().unwrap().epoch;
    }

    pub fn claim_rewards(&mut self, amount: u64) {
        self.total_rewards_claimed += amount;
    }
}
