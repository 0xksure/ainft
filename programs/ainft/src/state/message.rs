use anchor_lang::{prelude::*, Bump};

use super::{AiCharacterNFT, AiNft};

#[account]
pub struct MessageAiCharacter {
    pub ai_nft: Pubkey,
    pub ai_character: Pubkey,
    pub sender: Pubkey,
    pub content: String,
    pub response: Option<String>,
    pub answered: bool,
    pub bump: u8,
}

impl MessageAiCharacter {
    pub fn new(
        ai_nft: &Pubkey,
        ai_character: &Pubkey,
        sender: &Pubkey,
        content: &str,
        bump: u8,
    ) -> Self {
        Self {
            ai_nft: ai_nft.key(),
            ai_character: ai_character.key(),
            sender: sender.key(),
            content: content.to_string(),
            response: None,
            answered: false,
            bump,
        }
    }

    pub fn answer(&mut self, response: &str) {
        self.response = Some(response.to_string());
        self.answered = true;
    }
}
