use anchor_lang::prelude::*;

use crate::error::AiNftError;

/// Number of decimals for gas representation
pub const GAS_DECIMALS: u8 = 9;
/// Multiplier for converting between gas units
pub const GAS_DECIMALS_MULTIPLIER: u64 = 1_000_000_000; // 10^9

// Execution client defines the execution client that will be
// used to generate responses for the AI character
#[account]
pub struct ExecutionClient {
    pub ai_nft: Pubkey,
    pub authority: Pubkey,                 // The owner of the execution client
    pub compute_token_address: Pubkey,     // The address of the compute token
    pub gas: u64, // Gas amount in smallest units (1 = 0.000000001 compute tokens)
    pub compute_mint: Pubkey, // Original compute token mint
    pub liquid_staking_token_mint: Pubkey, // Staked compute token mint (st-compute)
    pub stake_pool_token_account: Pubkey, // Vault controlled by program for stakers
    pub total_compute: u64, // Total compute tokens in vault
    pub total_staked: u64, // Total staked tokens in circulation
    pub total_processed: u64, // Total messages processed
    pub staker_fee_share: u8, // Percentage (0-100) of fees that go to stakers
    pub active: bool, // Whether client is active
    pub bump: [u8; 1],
    pub supported_message_types: Vec<String>, // The message types that the execution client supports
}

// implement default for execution client
impl Default for ExecutionClient {
    fn default() -> Self {
        Self {
            ai_nft: Pubkey::default(),
            authority: Pubkey::default(),
            compute_token_address: Pubkey::default(),
            gas: 0,
            compute_mint: Pubkey::default(),
            liquid_staking_token_mint: Pubkey::default(),
            stake_pool_token_account: Pubkey::default(),
            total_compute: 0,
            total_staked: 0,
            total_processed: 0,
            staker_fee_share: 0,
            active: false,
            bump: [22],
            supported_message_types: Vec::new(),
        }
    }
}

impl ExecutionClient {
    pub fn set(
        &mut self,
        ai_nft: Pubkey,
        authority: Pubkey,
        gas: u64, // Gas in smallest units (e.g., 2_200_000_000 for 2.2 compute tokens)
        compute_mint: Pubkey,
        bump: u8,
        supported_message_types: Vec<String>,
        liquid_staking_token_mint: Pubkey,
        stake_pool_token_account: Pubkey,
        compute_token_address: Pubkey,
        staker_fee_share: u8,
    ) -> Result<()> {
        require!(staker_fee_share <= 100, AiNftError::InvalidFeeShare);
        // Ensure gas amount doesn't exceed total supply
        require!(
            gas <= 600_000_000 * GAS_DECIMALS_MULTIPLIER,
            AiNftError::InvalidGasAmount
        );

        self.ai_nft = ai_nft;
        self.authority = authority;
        self.gas = gas;
        self.compute_token_address = compute_token_address;
        self.compute_mint = compute_mint;
        self.liquid_staking_token_mint = liquid_staking_token_mint;
        self.stake_pool_token_account = stake_pool_token_account;
        self.total_compute = 0;
        self.total_staked = 0;
        self.total_processed = 0;
        self.staker_fee_share = staker_fee_share;
        self.active = true;
        self.bump = [bump];
        self.supported_message_types = supported_message_types;
        Ok(())
    }

    pub fn update_compute_token_amount(&mut self, amount: u64) {
        self.total_compute += amount;
    }

    pub fn update_total_processed(&mut self, amount: u64) {
        self.total_processed += amount;
    }

    pub fn add_stake(&mut self, amount: u64) {
        self.total_staked += amount;
    }

    /// Update gas amount (in smallest units)
    /// Example: To set gas to 2.2 compute tokens, pass 2_200_000_000
    pub fn update_gas(&mut self, new_gas: u64) -> Result<()> {
        require!(
            new_gas <= 600_000_000 * GAS_DECIMALS_MULTIPLIER,
            AiNftError::InvalidGasAmount
        );
        self.gas = new_gas;
        Ok(())
    }

    /// Get gas amount in smallest units
    /// Example: Returns 2_200_000_000 for 2.2 compute tokens
    pub fn get_gas(&self) -> u64 {
        self.gas
    }

    pub fn add_fees(&mut self, amount: u64) {
        let staker_portion = (amount as u128 * self.staker_fee_share as u128 / 100) as u64;
        let client_portion = amount - staker_portion;

        // Add staker portion to the staked token account's value
        self.total_compute += staker_portion;

        // Client portion goes to compute_token_address
        // This is handled in the instruction through token transfer
    }

    pub fn get_staking_rate(&self) -> Option<u64> {
        if self.total_staked == 0 {
            return None;
        }
        // Return rate in smallest units
        Some(
            (self.total_compute as u128 * GAS_DECIMALS_MULTIPLIER as u128
                / self.total_staked as u128) as u64,
        )
    }

    pub fn seeds(&self) -> [&[u8]; 4] {
        [
            b"execution_client",
            self.ai_nft.as_ref(),
            self.authority.as_ref(),
            &self.bump,
        ]
    }

    pub fn calculate_stake_amount(&self, compute_amount: u64) -> u64 {
        if self.total_staked == 0 {
            compute_amount
        } else {
            (compute_amount * self.total_staked) / self.total_compute
        }
    }

    pub fn calculate_unstake_amount(&self, staked_amount: u64) -> u64 {
        if self.total_staked == 0 {
            return 0;
        }
        (staked_amount * self.total_compute) / self.total_staked
    }

    pub fn calculate_fee_split(&self) -> (u64, u64) {
        let staker_portion = (self.gas as u128 * self.staker_fee_share as u128 / 100) as u64;
        let client_portion = self.gas - staker_portion;
        (staker_portion, client_portion)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// test fee split
    #[test]
    fn test_fee_split() {
        let client = ExecutionClient {
            staker_fee_share: 50,
            gas: 100 * GAS_DECIMALS_MULTIPLIER,
            ..Default::default()
        };
        let fee_split = client.calculate_fee_split();
        assert_eq!(fee_split.0, 50 * GAS_DECIMALS_MULTIPLIER);
        assert_eq!(fee_split.1, 50 * GAS_DECIMALS_MULTIPLIER);

        let client = ExecutionClient::default();
        let fee_split = client.calculate_fee_split();
        assert_eq!(fee_split.0, 0);
        assert_eq!(fee_split.1, 0);

        let client = ExecutionClient {
            staker_fee_share: 100,
            gas: 100 * GAS_DECIMALS_MULTIPLIER,
            ..Default::default()
        };
        let fee_split = client.calculate_fee_split();
        assert_eq!(fee_split.0, 100 * GAS_DECIMALS_MULTIPLIER);
        assert_eq!(fee_split.1, 0);

        let client = ExecutionClient {
            staker_fee_share: 0,
            gas: 100 * GAS_DECIMALS_MULTIPLIER,
            ..Default::default()
        };
        let fee_split = client.calculate_fee_split();
        assert_eq!(fee_split.0, 0);
        assert_eq!(fee_split.1, 100 * GAS_DECIMALS_MULTIPLIER);
    }

    #[test]
    fn test_gas_handling() {
        let mut client = ExecutionClient {
            ai_nft: Pubkey::default(),
            authority: Pubkey::default(),
            gas: 0,
            compute_token_address: Pubkey::default(),
            compute_mint: Pubkey::default(),
            liquid_staking_token_mint: Pubkey::default(),
            stake_pool_token_account: Pubkey::default(),
            total_compute: 0,
            total_staked: 0,
            total_processed: 0,
            staker_fee_share: 0,
            active: true,
            bump: [0],
            supported_message_types: vec![],
        };

        // Test setting gas to 2.2 compute tokens (2_200_000_000 in smallest units)
        client.update_gas(2_200_000_000).unwrap();
        assert_eq!(client.get_gas(), 2_200_000_000);

        // Test setting gas to 100 compute tokens
        client.update_gas(100_000_000_000).unwrap();
        assert_eq!(client.get_gas(), 100_000_000_000);

        // Test setting maximum allowed gas (600M tokens)
        client
            .update_gas(600_000_000 * GAS_DECIMALS_MULTIPLIER)
            .unwrap();
        assert_eq!(client.get_gas(), 600_000_000 * GAS_DECIMALS_MULTIPLIER);
    }

    #[test]
    #[should_panic]
    fn test_gas_exceeds_max() {
        let mut client = ExecutionClient {
            ai_nft: Pubkey::default(),
            authority: Pubkey::default(),
            gas: 0,
            compute_token_address: Pubkey::default(),
            compute_mint: Pubkey::default(),
            liquid_staking_token_mint: Pubkey::default(),
            stake_pool_token_account: Pubkey::default(),
            total_compute: 0,
            total_staked: 0,
            total_processed: 0,
            staker_fee_share: 0,
            active: true,
            bump: [0],
            supported_message_types: vec![],
        };

        // This should fail as it exceeds max supply
        client
            .update_gas(601_000_000 * GAS_DECIMALS_MULTIPLIER)
            .unwrap();
    }

    #[test]
    fn test_staking_rate() {
        let mut client = ExecutionClient {
            ai_nft: Pubkey::default(),
            authority: Pubkey::default(),
            gas: 1,
            compute_token_address: Pubkey::default(),
            compute_mint: Pubkey::default(),
            liquid_staking_token_mint: Pubkey::default(),
            stake_pool_token_account: Pubkey::default(),
            total_compute: 2_000_000_000, // 2 compute tokens
            total_staked: 1_000_000_000,  // 1 staked token
            total_processed: 0,
            staker_fee_share: 0,
            active: true,
            bump: [0],
            supported_message_types: vec![],
        };

        // Should return 2.0 in smallest units (2_000_000_000)
        assert_eq!(client.get_staking_rate().unwrap(), 2_000_000_000);
    }
}
