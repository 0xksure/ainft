"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    // Solana configuration
    rpcUrl: process.env.RPC_URL || "https://api.devnet.solana.com",
    programId: process.env.PROGRAM_ID || "3R1GZLu9iJHwLLvfwBXfWWW6s8tLsLcgSJCckwrnGQLD",
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
