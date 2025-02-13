use anchor_lang::{prelude::*, Bump};

use crate::error::AiNftError;

#[account(zero_copy(unsafe))]
#[derive(Default)]
pub struct VoiceSettings {
    pub model: [u8; 32],
}

impl From<VoiceSettingsInput> for VoiceSettings {
    fn from(input: VoiceSettingsInput) -> Self {
        Self { model: input.model }
    }
}

#[account(zero_copy(unsafe))]
#[derive(Default)]
pub struct Settings {
    pub voice: VoiceSettings,
}

impl From<SettingsInput> for Settings {
    fn from(input: SettingsInput) -> Self {
        Self {
            voice: input.voice.into(),
        }
    }
}

#[account(zero_copy(unsafe), Copy)]
#[derive(Default)]
pub struct StyleConfig {
    pub all: [[u8; 32]; 10],
    pub chat: [[u8; 32]; 10],
    pub post: [[u8; 32]; 10],
}

impl From<StyleConfigInput> for StyleConfig {
    fn from(input: StyleConfigInput) -> Self {
        Self {
            all: input.all,
            chat: input.chat,
            post: input.post,
        }
    }
}

#[account(zero_copy(unsafe))]
#[derive(Default)]
pub struct CharacterConfig {
    // name should only be 32 bytes
    pub name: [u8; 32],
    // each client is max 20 characters
    pub clients: [[u8; 20]; 10],
    pub model_provider: [u8; 20],
    pub settings: Settings,
    pub bio: [[u8; 32]; 10],
    pub lore: [[u8; 32]; 10],
    pub knowledge: [[u8; 32]; 10],
    pub topics: [[u8; 32]; 10],
    pub style: StyleConfig,
    pub adjectives: [[u8; 32]; 10],
}

impl CharacterConfig {
    pub fn from_input(input: CharacterConfigInput) -> Self {
        Self {
            name: input.name.as_bytes().try_into().unwrap(),
            clients: input
                .clients
                .iter()
                .map(|c| c.as_bytes().try_into().unwrap())
                .collect::<Vec<[u8; 20]>>()
                .try_into()
                .unwrap(),
            model_provider: input.model_provider.as_bytes().try_into().unwrap(),
            settings: input.settings.into(),
            bio: input
                .bio
                .iter()
                .map(|b| b.as_bytes().try_into().unwrap())
                .collect::<Vec<[u8; 32]>>()
                .try_into()
                .unwrap(),
            lore: input
                .lore
                .iter()
                .map(|l| l.as_bytes().try_into().unwrap())
                .collect::<Vec<[u8; 32]>>()
                .try_into()
                .unwrap(),
            knowledge: input
                .knowledge
                .iter()
                .map(|k| k.as_bytes().try_into().unwrap())
                .collect::<Vec<[u8; 32]>>()
                .try_into()
                .unwrap(),
            topics: input
                .topics
                .iter()
                .map(|t| t.as_bytes().try_into().unwrap())
                .collect::<Vec<[u8; 32]>>()
                .try_into()
                .unwrap(),
            style: input.style.into(),
            adjectives: input
                .adjectives
                .iter()
                .map(|a| a.as_bytes().try_into().unwrap())
                .collect::<Vec<[u8; 32]>>()
                .try_into()
                .unwrap(),
        }
    }

    pub fn update_name(&mut self, name: String) {
        let bytes = name.as_bytes();
        let len = bytes.len().min(32);
        self.name[..len].copy_from_slice(&bytes[..len]);
        if len < 32 {
            self.name[len..].fill(0);
        }
    }

    pub fn update_clients(&mut self, clients: Vec<String>) {
        for (i, client) in clients.iter().enumerate().take(10) {
            let bytes = client.as_bytes();
            let len = bytes.len().min(20);
            self.clients[i][..len].copy_from_slice(&bytes[..len]);
            if len < 20 {
                self.clients[i][len..].fill(0);
            }
        }
    }

    pub fn update_model_provider(&mut self, provider: String) {
        let bytes = provider.as_bytes();
        let len = bytes.len().min(20);
        self.model_provider[..len].copy_from_slice(&bytes[..len]);
        if len < 20 {
            self.model_provider[len..].fill(0);
        }
    }

    pub fn update_voice_settings(&mut self, model: [u8; 32]) {
        self.settings.voice.model = model;
    }

    pub fn update_bio(&mut self, bio: Vec<String>) {
        for (i, text) in bio.iter().enumerate().take(10) {
            let bytes = text.as_bytes();
            let len = bytes.len().min(32);
            self.bio[i][..len].copy_from_slice(&bytes[..len]);
            if len < 32 {
                self.bio[i][len..].fill(0);
            }
        }
    }

    pub fn update_lore(&mut self, lore: Vec<String>) {
        for (i, text) in lore.iter().enumerate().take(10) {
            let bytes = text.as_bytes();
            let len = bytes.len().min(32);
            self.lore[i][..len].copy_from_slice(&bytes[..len]);
            if len < 32 {
                self.lore[i][len..].fill(0);
            }
        }
    }

    pub fn update_knowledge(&mut self, knowledge: Vec<String>) {
        for (i, text) in knowledge.iter().enumerate().take(10) {
            let bytes = text.as_bytes();
            let len = bytes.len().min(32);
            self.knowledge[i][..len].copy_from_slice(&bytes[..len]);
            if len < 32 {
                self.knowledge[i][len..].fill(0);
            }
        }
    }

    pub fn update_topics(&mut self, topics: Vec<String>) {
        for (i, text) in topics.iter().enumerate().take(10) {
            let bytes = text.as_bytes();
            let len = bytes.len().min(32);
            self.topics[i][..len].copy_from_slice(&bytes[..len]);
            if len < 32 {
                self.topics[i][len..].fill(0);
            }
        }
    }

    pub fn update_style(&mut self, style: StyleConfigInput) {
        self.style = style.into();
    }

    pub fn update_adjectives(&mut self, adjectives: Vec<String>) {
        for (i, text) in adjectives.iter().enumerate().take(10) {
            let bytes = text.as_bytes();
            let len = bytes.len().min(32);
            self.adjectives[i][..len].copy_from_slice(&bytes[..len]);
            if len < 32 {
                self.adjectives[i][len..].fill(0);
            }
        }
    }

    pub fn update_style_all(&mut self, style_all: [[u8; 32]; 10]) {
        self.style.all = style_all;
    }

    pub fn update_style_chat(&mut self, style_chat: [[u8; 32]; 10]) {
        self.style.chat = style_chat;
    }

    pub fn update_style_post(&mut self, style_post: [[u8; 32]; 10]) {
        self.style.post = style_post;
    }

    // Helper method to update a single field while keeping others unchanged
    pub fn update_field(&mut self, field_name: &str, value: String) -> Result<()> {
        match field_name {
            "name" => self.update_name(value),
            "model_provider" => self.update_model_provider(value),
            _ => return Err(error!(AiNftError::InvalidConfigField)),
        }
        Ok(())
    }

    // Helper method to update multiple fields while keeping others unchanged
    pub fn update_array_field(&mut self, field_name: &str, values: Vec<String>) -> Result<()> {
        match field_name {
            "clients" => self.update_clients(values),
            "bio" => self.update_bio(values),
            "lore" => self.update_lore(values),
            "knowledge" => self.update_knowledge(values),
            "topics" => self.update_topics(values),
            "adjectives" => self.update_adjectives(values),
            _ => return Err(error!(AiNftError::InvalidConfigField)),
        }
        Ok(())
    }
}

/// voice settings input for the character config
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default)]
pub struct VoiceSettingsInput {
    pub model: [u8; 32],
}

/// settings input for the character config
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default)]
pub struct SettingsInput {
    pub voice: VoiceSettingsInput,
}

/// style config input for the character config
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default)]
pub struct StyleConfigInput {
    pub all: [[u8; 32]; 10],
    pub chat: [[u8; 32]; 10],
    pub post: [[u8; 32]; 10],
}

// struct for sending in the character config
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default)]
pub struct CharacterConfigInput {
    pub name: String,
    pub clients: Vec<String>,
    pub model_provider: String,
    pub settings: SettingsInput,
    pub bio: Vec<String>,
    pub lore: Vec<String>,
    pub knowledge: Vec<String>,
    pub topics: Vec<String>,
    pub style: StyleConfigInput,
    pub adjectives: Vec<String>,
}

impl CharacterConfig {
    fn init_byte_array<const N: usize, const M: usize>(text: &str) -> [[u8; N]; M] {
        let mut arr = [[0u8; N]; M];
        let bytes = text.as_bytes();
        let len = bytes.len().min(N);
        arr[0][..len].copy_from_slice(&bytes[..len]);
        arr
    }

    pub fn default() -> Self {
        Self {
            name: Self::init_byte_array::<32, 1>("Default Assistant")[0],
            clients: [[0u8; 20]; 10],
            model_provider: Self::init_byte_array::<20, 1>("anthropic")[0],
            settings: Settings {
                voice: VoiceSettings {
                    model: Self::init_byte_array::<32, 1>("en_GB-danny-low")[0],
                },
            },
            bio: Self::init_byte_array::<32, 10>("A helpful AI assistant"),
            lore: Self::init_byte_array::<32, 10>("Created to help users with their tasks"),
            knowledge: Self::init_byte_array::<32, 10>("General assistance"),
            topics: [[0u8; 32]; 10],
            style: StyleConfig {
                all: Self::init_byte_array::<32, 10>("Helpful"),
                chat: Self::init_byte_array::<32, 10>("Friendly"),
                post: Self::init_byte_array::<32, 10>("Professional"),
            },
            adjectives: Self::init_byte_array::<32, 10>("Helpful"),
        }
    }
}

#[account(zero_copy(unsafe))]
//#[repr(C)]
pub struct AiCharacterNFT {
    // The agent nft mint that the ai character is associated with
    pub app_ai_nft_mint: Pubkey,    // 32 bytes
    pub character_nft_mint: Pubkey, // 32 bytes
    pub name: [u8; 32],             // 32 bytes remove
    pub character_config: CharacterConfig,
    pub message_count: u64,   // 8 bytes
    pub total_processed: u64, // 8 bytes
    pub compute_token_account: Pubkey,
    pub execution_client: Pubkey, // 32 bytes
    pub price_per_message: u64,   // 8 bytes
    pub bump: [u8; 1],            // 1 byte
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
        execution_client: &Pubkey,
        compute_token_account: Option<Pubkey>,
        price_per_message: u64,
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
            price_per_message: price_per_message,
            execution_client: *execution_client,
            compute_token_account: compute_token_account.unwrap(),
            character_config: CharacterConfig::default(),
            bump: [bump; 1],
        }
    }

    pub fn set(
        &mut self,
        app_ai_nft_mint: &Pubkey,
        character_nft_mint: &Pubkey,
        name: &str,
        execution_client: &Pubkey,
        compute_token_account: Pubkey,
        bump: u8,
        price_per_message: u64,
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
        self.total_processed = 0;
        self.price_per_message = price_per_message;
        self.bump = [bump; 1];
    }

    pub fn update_price_per_message(&mut self, price_per_message: u64) {
        self.price_per_message = price_per_message;
    }

    pub fn update_character_config(&mut self, new_config: CharacterConfigInput) -> Result<()> {
        self.character_config = CharacterConfig::from_input(new_config);
        Ok(())
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

    pub fn update_config_name(&mut self, name: String) -> Result<()> {
        self.character_config.update_name(name);
        Ok(())
    }

    pub fn update_config_clients(&mut self, clients: Vec<String>) -> Result<()> {
        self.character_config.update_clients(clients);
        Ok(())
    }

    pub fn update_config_model_provider(&mut self, provider: String) -> Result<()> {
        self.character_config.update_model_provider(provider);
        Ok(())
    }

    pub fn update_config_voice_settings(&mut self, model: [u8; 32]) -> Result<()> {
        self.character_config.update_voice_settings(model);
        Ok(())
    }

    pub fn update_config_bio(&mut self, bio: Vec<String>) -> Result<()> {
        self.character_config.update_bio(bio);
        Ok(())
    }

    pub fn update_config_lore(&mut self, lore: Vec<String>) -> Result<()> {
        self.character_config.update_lore(lore);
        Ok(())
    }

    pub fn update_config_knowledge(&mut self, knowledge: Vec<String>) -> Result<()> {
        self.character_config.update_knowledge(knowledge);
        Ok(())
    }

    pub fn update_config_topics(&mut self, topics: Vec<String>) -> Result<()> {
        self.character_config.update_topics(topics);
        Ok(())
    }

    pub fn update_config_style(&mut self, style: StyleConfigInput) -> Result<()> {
        self.character_config.update_style(style);
        Ok(())
    }

    pub fn update_config_adjectives(&mut self, adjectives: Vec<String>) -> Result<()> {
        self.character_config.update_adjectives(adjectives);
        Ok(())
    }

    pub fn update_config_style_all(&mut self, style_all: [[u8; 32]; 10]) -> Result<()> {
        self.character_config.update_style_all(style_all);
        Ok(())
    }

    pub fn update_config_style_chat(&mut self, style_chat: [[u8; 32]; 10]) -> Result<()> {
        self.character_config.update_style_chat(style_chat);
        Ok(())
    }

    pub fn update_config_style_post(&mut self, style_post: [[u8; 32]; 10]) -> Result<()> {
        self.character_config.update_style_post(style_post);
        Ok(())
    }
}
