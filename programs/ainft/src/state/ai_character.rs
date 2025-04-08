use anchor_lang::{prelude::*, Bump};

use crate::error::AiNftError;
use crate::state::character_config::{CharacterConfigInput, StyleConfigInput};

#[account(zero_copy(unsafe))]
//#[repr(C)]
pub struct AiCharacterNFT {
    // The agent nft mint that the ai character is associated with
    pub app_ai_nft_mint: Pubkey,         // 32 bytes
    pub character_nft_mint: Pubkey,      // 32 bytes
    pub name: [u8; 32],                  // 32 bytes
    pub character_config_pubkey: Pubkey, // 32 bytes - Reference to the CharacterConfig account
    pub message_count: u64,              // 8 bytes
    pub total_processed: u64,            // 8 bytes
    pub compute_token_account: Pubkey,   // 32 bytes
    pub execution_client: Pubkey,        // 32 bytes
    pub bump: [u8; 1],                   // 1 byte
    // New fields for preminted NFTs
    pub is_preminted: bool, // Flag to indicate if this is a preminted NFT
    pub is_minted: bool,    // Whether this NFT has been minted by a user
}

impl AiCharacterNFT {
    pub fn as_seeds(&self) -> [&[u8]; 3] {
        [
            "ainft".as_bytes(),
            self.character_nft_mint.as_ref(),
            &self.bump,
        ]
    }

    pub fn try_new(
        app_ai_nft_mint: &Pubkey,
        character_nft_mint: &Pubkey,
        name: &str,
        execution_client: Option<Pubkey>,
        compute_token_account: Option<Pubkey>,
        character_config_pubkey: &Pubkey,
        bump: u8,
    ) -> Self {
        let mut name_bytes = [0u8; 32];
        let name_slice = name.as_bytes();
        let len = std::cmp::min(name_slice.len(), 32);
        name_bytes[..len].copy_from_slice(&name_slice[..len]);
        Self {
            app_ai_nft_mint: *app_ai_nft_mint,
            character_nft_mint: *character_nft_mint,
            name: name_bytes,
            message_count: 0,
            total_processed: 0,
            execution_client: execution_client.unwrap_or_default(),
            compute_token_account: compute_token_account.unwrap_or_default(),
            character_config_pubkey: *character_config_pubkey,
            bump: [bump; 1],
            // Initialize new fields
            is_preminted: false,
            is_minted: false,
        }
    }

    pub fn set(
        &mut self,
        app_ai_nft_mint: &Pubkey,
        character_nft_mint: &Pubkey,
        name: &str,
        execution_client: &Pubkey,
        compute_token_account: Pubkey,
        character_config_pubkey: &Pubkey,
        bump: u8,
    ) {
        let mut name_bytes = [0u8; 32];
        let name_slice = name.as_bytes();
        let len = std::cmp::min(name_slice.len(), 32);
        name_bytes[..len].copy_from_slice(&name_slice[..len]);
        self.app_ai_nft_mint = *app_ai_nft_mint;
        self.character_nft_mint = *character_nft_mint;
        self.name = name_bytes;
        self.execution_client = *execution_client;
        self.compute_token_account = compute_token_account;
        self.character_config_pubkey = *character_config_pubkey;
        self.total_processed = 0;
        self.bump = [bump; 1];
    }

    pub fn update_character_config_pubkey(&mut self, character_config_pubkey: Pubkey) {
        self.character_config_pubkey = character_config_pubkey;
    }

    pub fn update_compute_token_account(&mut self, compute_token_account: Pubkey) {
        self.compute_token_account = compute_token_account;
    }

    pub fn update_message_count(&mut self, message_count: u64) {
        self.message_count = message_count;
    }

    pub fn update_total_processed(&mut self) {
        self.total_processed += 1;
    }

    pub fn update_execution_client(&mut self, execution_client: Pubkey) {
        self.execution_client = execution_client;
    }

    // New methods for preminted NFTs
    pub fn set_preminted(&mut self, is_preminted: bool) {
        self.is_preminted = is_preminted;
    }

    pub fn set_minted(&mut self, is_minted: bool) {
        self.is_minted = is_minted;
    }

    pub fn update_character_config(&mut self, new_config: CharacterConfigInput) -> Result<()> {
        // Save the reference to the character config account
        // This method doesn't update the actual character config account,
        // it just updates the reference to it in the AiCharacterNFT account
        Ok(())
    }
}
