use anchor_lang::prelude::*;

#[event]
pub struct CollectionCreated {
    pub collection: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct AINFTAppInitialized {
    pub authority: Pubkey,
}

#[event]
pub struct AiNftMinted {
    pub ai_nft: Pubkey,
    pub collection: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct MessageSent {
    pub ai_nft: Pubkey,
    pub message: Pubkey,
    pub sender: Pubkey,
}

#[event]
pub struct ResponseWritten {
    pub ai_nft: Pubkey,
    pub message: Pubkey,
    pub execution_client: Pubkey,
}

#[event]
pub struct ExecutionClientStaked {
    pub client: Pubkey,
    pub authority: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ComputeTokensTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ExecutionPriceUpdated {
    pub client: Pubkey,
    pub new_price: u64,
}

#[event]
pub struct ExecutionClientConfigUpdated {
    pub client: Pubkey,
    pub new_gas: u64,
}

#[event]
pub struct CharacterConfigUpdated {
    pub ai_nft: Pubkey,
    pub owner: Pubkey,
    pub new_config: String,
}

#[event]
pub struct ComputeTokensTopUp {
    pub ai_nft: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TokenDonation {
    pub ai_nft: Pubkey,
    pub donor: Pubkey,
    pub recipient: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ComputeStaked {
    pub execution_client: Pubkey,
    pub staker: Pubkey,
    pub compute_amount: u64,
    pub staked_amount: u64,
    pub exchange_rate: f64,
}

#[event]
pub struct ComputeUnstaked {
    pub execution_client: Pubkey,
    pub staker: Pubkey,
    pub compute_amount: u64,
    pub staked_amount: u64,
    pub exchange_rate: f64,
}

#[event]
pub struct NFTPreminted {
    pub collection: Pubkey,
    pub nft_mint: Pubkey,
    pub authority: Pubkey,
    pub price: u64,
}

#[event]
pub struct PremintingFinalized {
    pub collection: Pubkey,
    pub authority: Pubkey,
    pub total_minted: u64,
}

#[event]
pub struct CollectionUpdated {
    pub collection: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct CollectionWhitelistUpdated {
    pub collection: Pubkey,
    pub authority: Pubkey,
    pub wallet: Pubkey,
    pub action: u8, // 0: add, 1: remove, 2: clear all
}
