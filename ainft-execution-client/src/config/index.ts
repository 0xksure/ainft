import dotenv from "dotenv";
dotenv.config();

export interface ExecutionClientConfig {
  // Solana configuration
  rpcUrl: string;
  programId: string;
  keypairPath: string;

  // LLM provider configuration
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;

  // Execution client settings
  pollingInterval: number;
  maxRetries: number;
  retryDelay: number;

  // Database configuration
  mongodbUri: string;

  // Plugins configuration
  pluginsDir: string;

  // Logging and monitoring
  logLevel: string;
}

export const config: ExecutionClientConfig = {
  // Solana configuration
  rpcUrl: process.env.RPC_URL || "https://api.devnet.solana.com",
  programId: process.env.PROGRAM_ID || "ArLePiNppazCKH1obDtf6BVUaid7h5YxEpP4UGpjMqo5",
  keypairPath: process.env.KEYPAIR_PATH || "./keypair.json",

  // LLM provider configuration
  llmProvider: process.env.LLM_PROVIDER || "openai",
  llmApiKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "gpt-4",

  // Execution client settings
  pollingInterval: parseInt(process.env.POLLING_INTERVAL || "1000"),
  maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
  retryDelay: parseInt(process.env.RETRY_DELAY || "2000"),

  // Database configuration
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/ainft-execution-client",

  // Plugins configuration
  pluginsDir: process.env.PLUGINS_DIR || "./plugins",

  // Logging and monitoring
  logLevel: process.env.LOG_LEVEL || "info",
};

