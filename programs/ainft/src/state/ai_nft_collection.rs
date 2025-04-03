use anchor_lang::prelude::*;

#[account]
pub struct AINFTCollection {
    pub authority: Pubkey,         // Collection owner
    pub mint: Pubkey,              // Collection mint
    pub name: String,              // Collection name
    pub symbol: String,            // Collection symbol
    pub uri: String,               // Collection URI
    pub royalty_basis_points: u16, // Royalty percentage in basis points (100 = 1%)
    pub mint_count: u64,           // Number of NFTs minted in this collection
    pub total_supply: u64,
    pub mint_price: u64, // Number of NFTs minted in this collection
    pub bump: [u8; 1],   // PDA bump
}

impl AINFTCollection {
    pub const LEN: usize = 8 + // discriminator
                           32 + // authority
                           32 + // mint
                           4 + 32 + // name (max 32 chars)
                           4 + 10 + // symbol (max 10 chars)
                           4 + 200 + // uri (max 200 chars)
                           2 + // royalty_basis_points
                           8 + // mint_count
                           8 + // total_supply
                           1; // bump

    pub fn seeds<'a>(&'a self) -> [&'a [u8]; 4] {
        [
            "collection".as_bytes(),
            self.authority.as_ref(),
            self.name.as_bytes(),
            &self.bump,
        ]
    }

    pub fn try_new(
        authority: Pubkey,
        mint: Pubkey,
        name: String,
        symbol: String,
        uri: String,
        royalty_basis_points: u16,
        mint_price: u64,
        total_supply: u64,
        bump: u8,
    ) -> Self {
        Self {
            authority,
            mint,
            name,
            symbol,
            uri,
            royalty_basis_points,
            mint_count: 0,
            total_supply,
            mint_price,
            bump: [bump],
        }
    }

    pub fn increment_mint_count(&mut self) {
        self.mint_count = self.mint_count.saturating_add(1);
    }

    pub fn increment_supply(&mut self) {
        self.total_supply = self.total_supply.saturating_add(1);
    }

    pub fn update_authority(&mut self, new_authority: Pubkey) {
        self.authority = new_authority;
    }

    pub fn update_uri(&mut self, new_uri: String) {
        self.uri = new_uri;
    }

    pub fn update_royalty_basis_points(&mut self, new_royalty_basis_points: u16) {
        self.royalty_basis_points = new_royalty_basis_points;
    }

    pub fn get_total_supply(&self) -> u64 {
        self.total_supply
    }

    pub fn get_authority(&self) -> Pubkey {
        self.authority
    }

    pub fn get_mint(&self) -> Pubkey {
        self.mint
    }
}
