use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::error::AiNftError;

use super::CreateAiNftParams;

// AI NFT defines the collection of AI characters
#[account]
pub struct AiNft {
    // Base
    pub authority: Pubkey,    // NFT owner
    pub compute_mint: Pubkey, // Compute token mint
    pub bump: [u8; 1],
}

impl AiNft {
    pub const LEN: usize = 8 + 32 + 32 + 1;
    pub fn as_seeds(&self) -> [&[u8]; 2] {
        ["app_ainft".as_bytes(), &self.bump]
    }

    pub fn try_new(bump: u8, publisher: Pubkey, params: &CreateAiNftParams) -> Result<Self> {
        Ok(Self {
            authority: publisher,
            compute_mint: params.compute_mint,
            bump: [bump],
        })
    }

    pub fn set_compute_mint(&mut self, compute_mint: Pubkey) {
        self.compute_mint = compute_mint;
    }

    pub fn check_compute_mint_initialized(&self) -> Result<()> {
        if self.compute_mint == Pubkey::default() {
            return err!(AiNftError::ComputeMintNotInitialized);
        }
        Ok(())
    }
}
