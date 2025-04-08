use anchor_lang::{prelude::*, Bump};

use crate::error::AiNftError;

#[account(zero_copy(unsafe))]
#[derive(Default)]
pub struct VoiceSettings {
    pub model: [u8; 32], // 32 bytes
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
    pub all: [[u8; 32]; 5],  // 160 bytes
    pub chat: [[u8; 32]; 5], // 160 bytes
    pub post: [[u8; 32]; 5], // 160 bytes
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
    pub name: [u8; 32], // 32 bytes
    // each client is max 20 characters
    pub clients: [[u8; 20]; 5],    // 100 bytes
    pub model_provider: [u8; 20],  // 20 bytes
    pub settings: Settings,        // 32 bytes
    pub bio: [[u8; 32]; 5],        // 160 bytes
    pub lore: [[u8; 32]; 5],       // 160 bytes
    pub knowledge: [[u8; 32]; 5],  // 160 bytes
    pub topics: [[u8; 32]; 5],     // 160 bytes
    pub style: StyleConfig,        // 160 bytes
    pub adjectives: [[u8; 32]; 5], // 160 bytes
    pub bump: u8,                  // 1 byte
    pub authority: Pubkey,         // 32 bytes - the authority that can update this config
}

impl CharacterConfig {
    pub fn from_input(input: CharacterConfigInput, authority: &Pubkey, bump: u8) -> Self {
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
            bump,
            authority: *authority,
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

    pub fn update_style_all(&mut self, style_all: [[u8; 32]; 5]) {
        self.style.all = style_all;
    }

    pub fn update_style_chat(&mut self, style_chat: [[u8; 32]; 5]) {
        self.style.chat = style_chat;
    }

    pub fn update_style_post(&mut self, style_post: [[u8; 32]; 5]) {
        self.style.post = style_post;
    }

    // Helper method to update a single field while keeping others unchanged
    pub fn update_field(&mut self, field_name: &str, value: String) -> Result<()> {
        match field_name {
            "name" => self.update_name(value),
            "model_provider" => self.update_model_provider(value),
            _ => return Err(AiNftError::InvalidFieldName.into()),
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
            _ => return Err(AiNftError::InvalidFieldName.into()),
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
    pub all: [[u8; 32]; 5],
    pub chat: [[u8; 32]; 5],
    pub post: [[u8; 32]; 5],
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
    pub fn init_byte_array<const N: usize, const M: usize>(text: &str) -> [[u8; N]; M] {
        let mut result = [[0u8; N]; M];
        let bytes = text.as_bytes();
        let len = bytes.len().min(N);
        result[0][..len].copy_from_slice(&bytes[..len]);
        result
    }

    pub fn default() -> Self {
        Self {
            name: Self::init_byte_array::<32, 1>("AI Assistant")[0],
            clients: [[0u8; 20]; 5],
            model_provider: [0u8; 20],
            settings: Settings {
                voice: VoiceSettings { model: [0u8; 32] },
            },
            bio: Self::init_byte_array::<32, 5>("A helpful AI assistant"),
            lore: Self::init_byte_array::<32, 5>("Created to help users with their tasks"),
            knowledge: Self::init_byte_array::<32, 5>("General assistance"),
            topics: [[0u8; 32]; 5],
            style: StyleConfig {
                all: Self::init_byte_array::<32, 5>("Helpful"),
                chat: Self::init_byte_array::<32, 5>("Friendly"),
                post: Self::init_byte_array::<32, 5>("Professional"),
            },
            adjectives: Self::init_byte_array::<32, 5>("Helpful"),
            bump: 0,
            authority: Pubkey::default(),
        }
    }
}
