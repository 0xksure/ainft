use anchor_lang::{prelude::*, Bump};

use super::{AiCharacterNFT, AiNft};

#[account]
pub struct MessageAiCharacter {
    pub ai_nft: Pubkey,           // 32 bytes
    pub ai_character: Pubkey,     // 32 bytes
    pub sender: Pubkey,           // 32 bytes
    pub content: String,          // MAX_CONTENT_LENGTH!
    pub response: Option<String>, // MAX_RESPONSE_LENGTH
    pub answered: bool,           // 1 byte
    pub created_at: i64,          // 8 bytes
    pub updated_at: i64,          // 8 bytes
    pub bump: u8,                 // 1 byte
}

pub mod message_constants {
    pub const DISCRIMINATOR_SIZE: usize = 8;
    pub const PUBKEY_SIZE: usize = 32;
    pub const BOOL_SIZE: usize = 1;
    pub const U8_SIZE: usize = 1;
    pub const I64_SIZE: usize = 8;
    pub const STRING_PREFIX_SIZE: usize = 4; // Size of the length prefix for strings
    pub const OPTION_PREFIX_SIZE: usize = 1; // Size of the discriminator for Option

    pub const MAX_CONTENT_LENGTH: usize = 1000; // Adjust based on your needs
    pub const MAX_RESPONSE_LENGTH: usize = 7000; // Adjust based on your needs

    pub const MESSAGE_AI_CHARACTER_SIZE: usize = DISCRIMINATOR_SIZE +
        PUBKEY_SIZE +                // ai_nft
        PUBKEY_SIZE +                // ai_character
        PUBKEY_SIZE +                // sender
        STRING_PREFIX_SIZE + MAX_CONTENT_LENGTH + // content
        OPTION_PREFIX_SIZE + STRING_PREFIX_SIZE + MAX_RESPONSE_LENGTH + // response
        BOOL_SIZE +                  // answered
        I64_SIZE +                   // created_at
        I64_SIZE +                   // updated_at
        U8_SIZE; // bump
}

impl MessageAiCharacter {
    pub fn new(
        ai_nft: &Pubkey,
        ai_character: &Pubkey,
        sender: &Pubkey,
        content: &str,
        bump: u8,
    ) -> Self {
        let current_timestamp = Clock::get().unwrap().unix_timestamp;
        Self {
            ai_nft: ai_nft.key(),
            ai_character: ai_character.key(),
            sender: sender.key(),
            content: content.to_string(),
            response: None,
            answered: false,
            created_at: current_timestamp,
            updated_at: current_timestamp,
            bump,
        }
    }

    pub fn answer(&mut self, response: &str) {
        let response_str = if response.len() > message_constants::MAX_RESPONSE_LENGTH {
            &response[0..message_constants::MAX_RESPONSE_LENGTH]
        } else {
            response
        };

        self.response = Some(response_str.to_string());
        self.answered = true;
        self.updated_at = Clock::get().unwrap().unix_timestamp;
    }
}
