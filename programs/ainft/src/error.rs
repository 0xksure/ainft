use anchor_lang::error_code;

#[error_code]
pub enum AiNftError {
    #[msg("Invalid config field")]
    InvalidConfigField,
    #[msg("Invalid execution client bump")]
    InvalidExecutionClientBump,
    #[msg("Invalid liquid staking mint")]
    InvalidLiquidStakingMint,
    #[msg("Invalid staker")]
    InvalidStaker,
    #[msg("Collection supply exceeded")]
    SupplyExceeded,
    #[msg("Invalid agent nft token account")]
    InvalidAgentNftTokenAccount,
    #[msg("Invalid mint authority")]
    InvalidMintAuthority,
    #[msg("Invalid AI NFT")]
    InvalidAiNft,
    #[msg("Invalid fee share")]
    InvalidFeeShare,
    #[msg("Invalid staked mint")]
    InvalidStakedMint,
    #[msg("Invalid compute vault")]
    InvalidComputeVault,
    #[msg("Invalid compute mint")]
    InvalidComputeMint,
    #[msg("Execution client not active")]
    ExecutionClientNotActive,
    #[msg("Stake account already exists")]
    StakeAccountAlreadyExists,
    #[msg("Stake account not found")]
    StakeAccountNotFound,
    #[msg("No supported message types")]
    NoSupportedMessageTypes,
    #[msg("Invalid gas amount")]
    InvalidGasAmount,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Invalid agent nft mint")]
    InvalidAgentNftMint,
    #[msg("Invalid collection supply")]
    InvalidSupply,
    #[msg("Invalid mint price")]
    InvalidMintPrice,
    #[msg("Invalid compute token amount")]
    InvalidComputeAmount,
    #[msg("Insufficient compute tokens. Please top up your agent")]
    InsufficientCompute,
    #[msg("Invalid execution client")]
    InvalidExecutionClient,
    #[msg("Execution client not active")]
    InactiveExecutionClient,
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    #[msg("Unstaking in cooldown")]
    UnstakingCooldown,
    #[msg("Invalid transfer")]
    InvalidTransfer,
    #[msg("Transfer cooldown active")]
    TransferCooldown,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Config string exceeds maximum length")]
    ConfigTooLong,
    #[msg("Invalid config format - must be valid JSON")]
    InvalidConfigFormat,
    #[msg("Only the NFT owner can update the character config")]
    UnauthorizedConfigUpdate,
    #[msg("Invalid donation amount")]
    InvalidDonationAmount,
    #[msg("Missing required accounts for action")]
    MissingActionAccounts,
    #[msg("Action execution failed")]
    ActionExecutionFailed,
    #[msg("Invalid action parameters")]
    InvalidActionParams,
    #[msg("Compute mint not initialized")]
    ComputeMintNotInitialized,
    InvalidTokenOwner,
    Overflow,
}
