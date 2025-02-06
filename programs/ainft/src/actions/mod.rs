use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum Action {
    Transfer,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ActionParams {
    pub action_type: Action,
    pub amount: Option<u64>,
}

impl ActionParams {
    pub fn new_transfer(amount: u64) -> Self {
        Self {
            action_type: Action::Transfer,
            amount: Some(amount),
        }
    }
}
