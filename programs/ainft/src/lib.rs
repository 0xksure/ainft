use anchor_lang::prelude::*;
use anchor_spl::metadata::{Metadata, MetadataAccount};
mod actions;
mod error;
mod events;
pub mod instructions;
mod state;
use instructions::*;
use state::CharacterConfigInput;
use state::StyleConfigInput;

declare_id!("14M8GDtWobqndjTrJ4sDZJ2CY74TXyGWGJzJoAE4TNYh");

/// AI NFT Program
///
/// A Solana program for creating and managing AI-powered NFTs that can interact with users
/// through various execution clients.
#[program]
pub mod ainft {

    use super::*;

    /// Creates a new AI NFT collection
    ///
    /// A collection serves as a container for AI NFTs with shared properties like
    /// maximum supply, mint price, and default execution client.
    ///
    /// # Arguments
    /// * `name` - The name of the collection
    /// * `max_supply` - Maximum number of NFTs that can be minted in this collection
    /// * `mint_price` - Price in lamports to mint each NFT
    /// * `default_execution_client` - Default execution client for NFTs in this collection
    pub fn create_app_ainft(
        ctx: Context<CreateAppAiNft>,
        create_ai_nft_params: state::CreateAiNftParams,
    ) -> Result<()> {
        instructions::create_app_ainft_handler(ctx, create_ai_nft_params)
    }

    /// Mints a new AI NFT
    ///
    /// Creates a new AI NFT with specified character configuration and metadata.
    /// Requires payment of the collection's mint price.
    ///
    /// # Arguments
    /// * `name` - Name of the AI NFT
    /// * `uri` - URI pointing to the NFT's metadata
    /// * `character_config` - JSON configuration defining the AI's personality and behavior
    pub fn mint_ainft(ctx: Context<MintAiNft>, name: String, uri: String) -> Result<()> {
        instructions::mint_ainft_handler(ctx, name, uri)
    }

    /// Creates a compute mint for an AI NFT
    pub fn create_compute_mint(ctx: Context<CreateComputeMint>) -> Result<()> {
        instructions::create_compute_mint_handler(ctx)
    }

    /// Mints compute tokens to an AI NFT
    pub fn mint_compute(ctx: Context<MintCompute>, amount: u64) -> Result<()> {
        instructions::mint_compute_handler(ctx, amount)
    }

    /// Sends a message to an AI NFT
    ///
    /// Allows users to interact with an AI NFT by sending messages.
    /// Requires compute tokens for processing.
    ///
    /// # Arguments
    /// * `content` - The message content
    pub fn send_message(ctx: Context<SendMessage>, content: String) -> Result<()> {
        instructions::send_message_handler(ctx, content)
    }

    /// Writes a response from an execution client
    ///
    /// Records the AI's response to a message. Can only be called by
    /// the assigned execution client.
    ///
    /// # Arguments
    /// * `response` - The AI's response content
    pub fn write_response(
        ctx: Context<WriteResponse>,
        response: ResponseWithActions,
    ) -> Result<()> {
        instructions::write_response_handler(ctx, response)
    }

    /// Creates a new stake account for an execution client
    pub fn create_stake_account(ctx: Context<CreateStakeAccount>) -> Result<()> {
        instructions::create_stake_account_handler(ctx)
    }

    /// Registers an execution client
    pub fn register_execution_client(
        ctx: Context<RegisterExecutionClient>,
        gas: u64,
        supported_message_types: Vec<String>,
        staker_fee_share: u8,
        execution_client_bump: u8,
    ) -> Result<()> {
        instructions::register_execution_client_handler(
            ctx,
            gas,
            supported_message_types,
            staker_fee_share,
            execution_client_bump,
        )
    }

    /// Stakes compute tokens to an execution client
    pub fn stake_compute(ctx: Context<StakeCompute>, amount: u64) -> Result<()> {
        instructions::stake_compute_handler(ctx, amount)
    }

    /// Unstakes tokens from an execution client
    pub fn unstake_compute(ctx: Context<UnstakeCompute>, staked_amount: u64) -> Result<()> {
        instructions::unstake_compute_handler(ctx, staked_amount)
    }

    /// Updates execution client settings
    ///
    /// Allows clients to update their active status and supported message types.
    ///
    /// # Arguments
    /// * `new_gas` - The new gas price for the execution client
    pub fn update_execution_client_config(
        ctx: Context<UpdateExecutionClientConfig>,
        new_gas: u64,
    ) -> Result<()> {
        instructions::update_execution_client_config_handler(ctx, new_gas)
    }

    /// Updates an AI NFT's character configuration
    ///
    /// Allows NFT owners to update their AI's personality and behavior settings.
    ///
    /// # Arguments
    /// * `new_config` - New JSON configuration for the AI character
    pub fn update_character_config(
        ctx: Context<UpdateAiCharacter>,
        character_config: CharacterConfigInput,
    ) -> Result<()> {
        instructions::update_character_config_handler(ctx, character_config)
    }

    /// Updates an AI NFT's execution client
    pub fn update_ai_character_execution_client(
        ctx: Context<UpdateAiCharacterExecutionClient>,
    ) -> Result<()> {
        instructions::update_ai_character_execution_client_handler(ctx)
    }

    /// Creates a compute token account for an AI character
    pub fn create_ai_character_compute_account(
        ctx: Context<CreateAiCharacterComputeAccount>,
    ) -> Result<()> {
        instructions::create_ai_character_compute_account_handler(ctx)
    }

    /// Updates an AI NFT's character name
    pub fn update_character_name(
        ctx: Context<UpdateCharacterConfigField>,
        name: String,
    ) -> Result<()> {
        instructions::update_character_name_handler(ctx, name)
    }

    /// Updates an AI NFT's supported clients
    pub fn update_character_clients(
        ctx: Context<UpdateCharacterConfigField>,
        clients: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_clients_handler(ctx, clients)
    }

    /// Updates an AI NFT's model provider
    pub fn update_character_model_provider(
        ctx: Context<UpdateCharacterConfigField>,
        provider: String,
    ) -> Result<()> {
        instructions::update_character_model_provider_handler(ctx, provider)
    }

    /// Updates an AI NFT's voice settings
    pub fn update_character_voice_settings(
        ctx: Context<UpdateCharacterConfigField>,
        model: [u8; 32],
    ) -> Result<()> {
        instructions::update_character_voice_settings_handler(ctx, model)
    }

    /// Updates an AI NFT's bio
    pub fn update_character_bio(
        ctx: Context<UpdateCharacterConfigField>,
        bio: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_bio_handler(ctx, bio)
    }

    /// Updates an AI NFT's lore
    pub fn update_character_lore(
        ctx: Context<UpdateCharacterConfigField>,
        lore: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_lore_handler(ctx, lore)
    }

    /// Updates an AI NFT's knowledge
    pub fn update_character_knowledge(
        ctx: Context<UpdateCharacterConfigField>,
        knowledge: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_knowledge_handler(ctx, knowledge)
    }

    /// Updates an AI NFT's topics
    pub fn update_character_topics(
        ctx: Context<UpdateCharacterConfigField>,
        topics: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_topics_handler(ctx, topics)
    }

    /// Updates an AI NFT's style configuration
    pub fn update_character_style(
        ctx: Context<UpdateCharacterConfigField>,
        style: StyleConfigInput,
    ) -> Result<()> {
        instructions::update_character_style_handler(ctx, style)
    }

    /// Updates an AI NFT's adjectives
    pub fn update_character_adjectives(
        ctx: Context<UpdateCharacterConfigField>,
        adjectives: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_adjectives_handler(ctx, adjectives)
    }

    /// Updates an AI NFT's style all configuration
    pub fn update_character_style_all(
        ctx: Context<UpdateCharacterConfigField>,
        style_all: [[u8; 32]; 10],
    ) -> Result<()> {
        instructions::update_character_style_all_handler(ctx, style_all)
    }

    /// Updates an AI NFT's style chat configuration
    pub fn update_character_style_chat(
        ctx: Context<UpdateCharacterConfigField>,
        style_chat: [[u8; 32]; 10],
    ) -> Result<()> {
        instructions::update_character_style_chat_handler(ctx, style_chat)
    }

    /// Updates an AI NFT's style post configuration
    pub fn update_character_style_post(
        ctx: Context<UpdateCharacterConfigField>,
        style_post: [[u8; 32]; 10],
    ) -> Result<()> {
        instructions::update_character_style_post_handler(ctx, style_post)
    }
}
