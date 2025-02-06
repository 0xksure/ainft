use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::error::AiNftError;

use super::CreateAiNftParams;

// AI NFT defines the collection of AI characters
#[account]
pub struct AiNft {
    // Base
    pub authority: Pubkey,                // NFT owner
    pub master_metadata: Pubkey,          // Collection this NFT belongs to
    pub master_mint: Pubkey,              // NFT mint
    pub compute_mint: Pubkey,             // Compute token mint
    pub default_execution_client: Pubkey, // Default execution client
    pub mint_count: u64,                  // Number of NFTs minted
    pub mint_price: u64,                  // Price in lamports
    pub max_supply: u64,                  // Maximum number of mints (0 for unlimited)
    pub bump: [u8; 1],
}

impl AiNft {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 32 + 1 + 8 + 8 + 16 + 8 + 1;
    pub fn as_seeds(&self) -> [&[u8]; 2] {
        ["app_ainft".as_bytes(), &self.bump]
    }

    pub fn try_new(
        bump: u8,
        publisher: Pubkey,
        master_metadata: Pubkey,
        master_mint: Pubkey,
        params: &CreateAiNftParams,
    ) -> Result<Self> {
        Ok(Self {
            authority: publisher,
            master_metadata,
            master_mint,
            compute_mint: Pubkey::default(),
            default_execution_client: params.default_execution_client,
            mint_count: 0,
            mint_price: params.mint_price,
            max_supply: params.max_supply,
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
