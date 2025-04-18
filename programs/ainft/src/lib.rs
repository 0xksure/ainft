use anchor_lang::prelude::*;
mod actions;
mod error;
mod events;
pub mod instructions;
mod state;
use instructions::update_collection_whitelist::WhitelistAction;
use instructions::*;
use state::CharacterConfigInput;
use state::StyleConfigInput;

declare_id!("ArLePiNppazCKH1obDtf6BVUaid7h5YxEpP4UGpjMqo5");

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

    /// Create colletion
    ///
    pub fn create_ainft_collection(
        ctx: Context<CreateCollection>,
        name: String,
        uri: String,
        description: String,
        royalty_basis_points: u16,
        mint_price: u64,
        start_mint_date: i64,
        end_mint_date: i64,
    ) -> Result<()> {
        instructions::create_collection_handler(
            ctx,
            name,
            uri,
            description,
            royalty_basis_points,
            mint_price,
            start_mint_date,
            end_mint_date,
        )
    }

    /// Updates a collection's settings
    ///
    /// Allows the collection owner to update various collection settings
    /// before preminting is finalized.
    ///
    /// # Arguments
    /// * `collection_name` - Name of the collection to update
    /// * `new_name` - Optional new name
    /// * `new_uri` - Optional new URI
    /// * `new_description` - Optional new description
    /// * `new_mint_price` - Optional new mint price
    /// * `new_start_mint_date` - Optional new start date for minting (unix timestamp)
    /// * `new_end_mint_date` - Optional new end date for minting (unix timestamp)
    pub fn update_collection(
        ctx: Context<UpdateCollection>,
        collection_name: String,
        new_name: Option<String>,
        new_uri: Option<String>,
        new_description: Option<String>,
        new_mint_price: Option<u64>,
        new_start_mint_date: Option<i64>,
        new_end_mint_date: Option<i64>,
    ) -> Result<()> {
        instructions::update_collection_handler(
            ctx,
            collection_name,
            new_name,
            new_uri,
            new_description,
            new_mint_price,
            new_start_mint_date,
            new_end_mint_date,
        )
    }

    /// Updates a collection's whitelist
    ///
    /// Allows the collection owner to add or remove wallets from the whitelist
    /// before preminting is finalized.
    ///
    /// # Arguments
    /// * `collection_name` - Name of the collection to update
    /// * `wallet` - Wallet to add or remove from whitelist
    /// * `action` - Whether to add or remove the wallet
    pub fn update_collection_whitelist(
        ctx: Context<UpdateCollectionWhitelist>,
        collection_name: String,
        wallet: Pubkey,
        action: WhitelistAction,
    ) -> Result<()> {
        instructions::update_collection_whitelist_handler(ctx, collection_name, wallet, action)
    }

    /// Clears a collection's whitelist
    ///
    /// Allows the collection owner to clear the entire whitelist
    /// before preminting is finalized.
    ///
    /// # Arguments
    /// * `collection_name` - Name of the collection to update
    pub fn clear_collection_whitelist(
        ctx: Context<UpdateCollectionWhitelist>,
        collection_name: String,
    ) -> Result<()> {
        instructions::clear_collection_whitelist_handler(ctx, collection_name)
    }

    /// Creates a preminted NFT owned by the collection
    ///
    /// This allows collection creators to pre-mint NFTs that can later be purchased by users.
    /// Only the collection creator can create preminted NFTs for their collection.
    ///
    /// # Arguments
    /// * `name` - Name of the AI NFT
    /// * `uri` - URI pointing to the NFT's metadata
    /// * `collection_name` - Name of the collection this NFT belongs to
    /// * `price` - Price in lamports that users will pay to mint this NFT
    pub fn create_preminted_nft(
        ctx: Context<CreatePremintedNft>,
        name: String,
        uri: String,
        collection_name: String,
        price: u64,
        default_execution_client: Option<Pubkey>,
    ) -> Result<()> {
        instructions::create_preminted_nft_handler(
            ctx,
            name,
            uri,
            collection_name,
            price,
            default_execution_client,
        )
    }

    /// Creates a compute token account for an AI character
    pub fn create_ai_character_compute_account(
        ctx: Context<CreateAiCharacterComputeAccount>,
    ) -> Result<()> {
        instructions::create_ai_character_compute_account_handler(ctx)
    }

    /// Creates a character configuration account
    ///
    /// This allows users to create a character configuration that can be used
    /// when minting or preminting NFTs.
    ///
    /// # Arguments
    /// * `config_input` - The character configuration input
    pub fn create_character_config(
        ctx: Context<CreateCharacterConfig>,
        id: String,
        config_input: CharacterConfigInput,
    ) -> Result<()> {
        instructions::create_character_config_handler(ctx, id, config_input)
    }

    /// Mints a new AI NFT from an existing Metaplex collection
    ///
    /// Creates a new AI NFT with specified character configuration and metadata.
    /// Requires payment of the collection's mint price.
    ///
    /// # Arguments
    /// * `name` - Name of the AI NFT
    /// * `uri` - URI pointing to the NFT's metadata
    /// * `character_config` - JSON configuration defining the AI's personality and behavior
    pub fn mint_ainft_from_collection(ctx: Context<PurchasePremintedNft>) -> Result<()> {
        instructions::purchase_preminted_nft_handler(ctx)
    }

    /// Sets an externally created token as the compute mint for an AI NFT
    ///
    /// This allows the admin to use a token that was minted outside the program
    /// as the compute token for the AI NFT.
    pub fn set_external_compute_mint(ctx: Context<SetExternalComputeMint>) -> Result<()> {
        instructions::set_external_compute_mint_handler(ctx)
    }

    /// Sends a message to an AI NFT
    ///
    /// Allows users to interact with an AI NFT by sending messages.
    /// Requires the user to pay with compute tokens for each message.
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

    /// Updates the character config associated with an AI character NFT
    ///
    /// This allows NFT owners to change which character configuration is associated with their NFT.
    /// The owner must own both the NFT and the character configuration.
    pub fn update_ai_character_config(ctx: Context<UpdateAiCharacterConfig>) -> Result<()> {
        instructions::update_ai_character_config_handler(ctx)
    }

    /// Updates an AI NFT's character names
    pub fn update_character_name(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        name: String,
    ) -> Result<()> {
        instructions::update_character_name_handler(ctx, id, name)
    }

    /// Updates an AI NFT's supported clients
    pub fn update_character_clients(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        clients: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_clients_handler(ctx, id, clients)
    }

    /// Updates an AI NFT's model provider
    pub fn update_character_model_provider(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        provider: String,
    ) -> Result<()> {
        instructions::update_character_model_provider_handler(ctx, id, provider)
    }

    /// Updates an AI NFT's voice settings
    pub fn update_character_voice_settings(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        model: [u8; 32],
    ) -> Result<()> {
        instructions::update_character_voice_settings_handler(ctx, id, model)
    }

    /// Updates an AI NFT's bio
    pub fn update_character_bio(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        bio: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_bio_handler(ctx, id, bio)
    }

    /// Updates an AI NFT's lore
    pub fn update_character_lore(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        lore: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_lore_handler(ctx, id, lore)
    }

    /// Updates an AI NFT's knowledge
    pub fn update_character_knowledge(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        knowledge: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_knowledge_handler(ctx, id, knowledge)
    }

    /// Updates an AI NFT's topics
    pub fn update_character_topics(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        topics: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_topics_handler(ctx, id, topics)
    }

    /// Updates an AI NFT's style configuration
    pub fn update_character_style(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        style: StyleConfigInput,
    ) -> Result<()> {
        instructions::update_character_style_handler(ctx, id, style)
    }

    /// Updates an AI NFT's adjectives
    pub fn update_character_adjectives(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        adjectives: Vec<String>,
    ) -> Result<()> {
        instructions::update_character_adjectives_handler(ctx, id, adjectives)
    }

    /// Updates an AI NFT's style all configuration
    pub fn update_character_style_all(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        style_all: [[u8; 32]; 5],
    ) -> Result<()> {
        instructions::update_character_style_all_handler(ctx, id, style_all)
    }

    /// Updates an AI NFT's style chat configuration
    pub fn update_character_style_chat(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        style_chat: [[u8; 32]; 5],
    ) -> Result<()> {
        instructions::update_character_style_chat_handler(ctx, id, style_chat)
    }

    /// Updates an AI NFT's style post configuration
    pub fn update_character_style_post(
        ctx: Context<UpdateCharacterConfigField>,
        id: String,
        style_post: [[u8; 32]; 5],
    ) -> Result<()> {
        instructions::update_character_style_post_handler(ctx, id, style_post)
    }

    /// Finalizes the preminting phase for a collection
    ///
    /// After finalization, no more NFTs can be preminted in the collection,
    /// and the collection settings and whitelist cannot be updated anymore.
    /// This is irreversible.
    ///
    /// # Arguments
    /// * `collection_name` - Name of the collection to finalize
    pub fn finalize_preminting(
        ctx: Context<FinalizePreminting>,
        collection_name: String,
    ) -> Result<()> {
        instructions::finalize_preminting_handler(ctx, collection_name)
    }
}
