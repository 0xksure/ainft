use anchor_lang::prelude::*;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateAiNftParams {
    pub name: String,
    pub compute_mint: Pubkey,
}
