use anchor_lang::prelude::*;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateAiNftParams {
    pub name: String,
    pub uri: String,
    pub symbol: String,
    pub default_execution_client: Pubkey,
    pub mint_price: u64,
    pub max_supply: u64,
}
