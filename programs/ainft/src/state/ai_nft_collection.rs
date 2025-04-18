use anchor_lang::prelude::*;

#[account]
pub struct AINFTCollection {
    pub authority: Pubkey,          // Collection owner
    pub mint: Pubkey,               // Collection mint
    pub name: String,               // Collection name
    pub uri: String,                // Collection URI
    pub description: String,        // Collection description
    pub royalty_basis_points: u16,  // Royalty percentage in basis points (100 = 1%)
    pub mint_count: u64,            // Number of NFTs minted in this collection
    pub mint_price: u64,            // Mint price in lamports
    pub start_mint_date: i64,       // Start date for minting (unix timestamp)
    pub end_mint_date: i64,         // End date for minting (unix timestamp, 0 means no end date)
    pub preminting_finalized: bool, // Whether preminting has been finalized
    pub whitelist: Vec<Pubkey>,     // List of whitelisted wallets (empty means no whitelist)
    pub bump: [u8; 1],              // PDA bump
}

impl AINFTCollection {
    pub const LEN: usize = 8 + // discriminator
                           32 + // authority
                           32 + // mint
                           4 + 32 + // name (max 32 chars)
                           4 + 200 + // uri (max 200 chars)
                           4 + 500 + // description (max 500 chars)
                           2 + // royalty_basis_points
                           8 + // mint_count
                           8 + // mint_price
                           8 + // start_mint_date
                           8 + // end_mint_date
                           1 + // preminting_finalized
                           4 + (32 * 20) + // whitelist (vector with max 20 pubkeys)
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
        uri: String,
        description: String,
        royalty_basis_points: u16,
        mint_price: u64,
        start_mint_date: i64,
        end_mint_date: i64,
        bump: u8,
    ) -> Self {
        Self {
            authority,
            mint,
            name,
            uri,
            description,
            royalty_basis_points,
            mint_count: 0,
            mint_price,
            start_mint_date,
            end_mint_date,
            preminting_finalized: false,
            whitelist: Vec::new(),
            bump: [bump],
        }
    }

    pub fn increment_mint_count(&mut self) {
        self.mint_count = self.mint_count.saturating_add(1);
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

    pub fn update_name(&mut self, new_name: String) {
        self.name = new_name;
    }

    pub fn update_mint_price(&mut self, new_mint_price: u64) {
        self.mint_price = new_mint_price;
    }

    pub fn update_mint_dates(&mut self, new_start_date: i64, new_end_date: i64) {
        self.start_mint_date = new_start_date;
        self.end_mint_date = new_end_date;
    }

    pub fn update_description(&mut self, new_description: String) {
        self.description = new_description;
    }

    pub fn is_whitelisted(&self, wallet: &Pubkey) -> bool {
        // If whitelist is empty, everyone is allowed
        if self.whitelist.is_empty() {
            return true;
        }

        // Otherwise, check if wallet is in the whitelist
        self.whitelist.contains(wallet)
    }

    pub fn add_to_whitelist(&mut self, wallet: Pubkey) -> Result<()> {
        // Check if wallet is already in the whitelist
        if self.whitelist.contains(&wallet) {
            return Ok(());
        }

        // Add the wallet to the whitelist
        self.whitelist.push(wallet);
        Ok(())
    }

    pub fn remove_from_whitelist(&mut self, wallet: &Pubkey) -> Result<()> {
        // Find the index of the wallet in the whitelist
        if let Some(index) = self.whitelist.iter().position(|x| x == wallet) {
            // Remove the wallet from the whitelist
            self.whitelist.remove(index);
        }

        Ok(())
    }

    pub fn get_total_supply(&self) -> u64 {
        // Since total_supply is removed, we can return a default value or some other metric
        // For now, we'll return 0 to indicate unlimited supply
        0
    }

    pub fn get_authority(&self) -> Pubkey {
        self.authority
    }

    pub fn get_mint(&self) -> Pubkey {
        self.mint
    }

    pub fn is_mint_active(&self, current_time: i64) -> bool {
        // Check if current time is after start time
        if current_time < self.start_mint_date {
            return false;
        }

        // Check if current time is before end time (if end time is set)
        if self.end_mint_date > 0 && current_time > self.end_mint_date {
            return false;
        }

        true
    }
}
