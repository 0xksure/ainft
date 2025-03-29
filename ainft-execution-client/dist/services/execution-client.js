"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionClientService = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const fs_1 = __importDefault(require("fs"));
const registry_1 = require("../plugins/registry");
const database_1 = require("./database");
const models_1 = require("../models");
const dotenv_1 = __importDefault(require("dotenv"));
const ainft_1 = require("../idl/ainft");
// Load environment variables
dotenv_1.default.config();
/**
 * Execution Client Service
 */
class ExecutionClientService {
    constructor() {
        this.pollingInterval = null;
        this.running = false;
        // Create Solana connection
        const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
        // Load keypair
        const keypairPath = process.env.KEYPAIR_PATH || './keypair.json';
        const keypairData = JSON.parse(fs_1.default.readFileSync(keypairPath, 'utf-8'));
        const keypair = web3_js_1.Keypair.fromSecretKey(new Uint8Array(keypairData));
        // Create wallet and provider
        this.wallet = new anchor_1.Wallet(keypair);
        const provider = new anchor_1.AnchorProvider(this.connection, this.wallet, { commitment: 'confirmed' });
        // Create program with IDL
        const programId = new web3_js_1.PublicKey(process.env.PROGRAM_ID || ainft_1.AINFT_PROGRAM_ID.toString());
        this.program = new anchor_1.Program(ainft_1.AINFT_IDL, provider);
        // Create plugin registry
        this.pluginRegistry = new registry_1.PluginRegistry({
            config: {
                connection: this.connection,
                program: this.program,
                wallet: this.wallet
            },
            logger: console
        });
    }
    /**
     * Initialize the execution client
     */
    async initialize() {
        try {
            // Connect to database
            await database_1.DatabaseService.getInstance().connect();
            // Load plugins
            await this.pluginRegistry.loadPluginsFromDirectory(process.env.PLUGINS_DIR || './plugins');
            // Initialize execution client state
            await this.getExecutionClientState();
            console.log('Execution client initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize execution client:', error);
            throw error;
        }
    }
    /**
     * Start the execution client
     */
    async start() {
        if (this.running) {
            console.log('Execution client is already running');
            return;
        }
        try {
            // Start polling for new messages
            const pollingIntervalMs = parseInt(process.env.POLLING_INTERVAL || '1000', 10);
            this.pollingInterval = setInterval(() => this.pollForNewMessages(), pollingIntervalMs);
            this.running = true;
            console.log(`Execution client started with polling interval ${pollingIntervalMs}ms`);
        }
        catch (error) {
            console.error('Failed to start execution client:', error);
            throw error;
        }
    }
    /**
     * Stop the execution client
     */
    async stop() {
        if (!this.running) {
            console.log('Execution client is not running');
            return;
        }
        try {
            // Stop polling for new messages
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
            this.running = false;
            console.log('Execution client stopped');
        }
        catch (error) {
            console.error('Failed to stop execution client:', error);
            throw error;
        }
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            // Stop polling
            await this.stop();
            // Clean up plugins
            await this.pluginRegistry.cleanup();
            // Disconnect from database
            await database_1.DatabaseService.getInstance().disconnect();
            console.log('Execution client cleaned up successfully');
        }
        catch (error) {
            console.error('Failed to clean up execution client:', error);
            throw error;
        }
    }
    /**
     * Poll for new messages
     */
    async pollForNewMessages() {
        try {
            // Get unanswered messages
            const messages = await this.getUnansweredMessages();
            if (messages.length === 0) {
                return;
            }
            console.log(`Found ${messages.length} unanswered messages`);
            // Process each message
            for (const message of messages) {
                await this.processMessage(message);
            }
            // Update execution client state
            await this.updateExecutionClientState();
        }
        catch (error) {
            console.error('Failed to poll for new messages:', error);
        }
    }
    /**
     * Get unanswered messages
     */
    async getUnansweredMessages() {
        try {
            // In a real implementation, this would fetch messages from the blockchain
            // For demonstration purposes, we'll fetch from the database
            const messages = await models_1.MessageModel.find({
                answered: false
            }).limit(10);
            return messages;
        }
        catch (error) {
            console.error('Failed to get unanswered messages:', error);
            return [];
        }
    }
    /**
     * Process a message
     * @param message Message to process
     */
    async processMessage(message) {
        try {
            console.log(`Processing message ${message.id}`);
            // Collect data for the message
            const collectedData = await this.collectData(message);
            // Enhance the prompt
            const enhancedPrompt = await this.enhancePrompt(message.content, { messageId: message.id, collectedData });
            // Generate response using LLM
            const response = await this.generateResponse(enhancedPrompt);
            // Process the response
            const processedResponse = await this.processResponse(response, { messageId: message.id, collectedData });
            // Write response to blockchain
            await this.writeResponse(message, processedResponse);
            console.log(`Processed message ${message.id}`);
        }
        catch (error) {
            console.error(`Failed to process message ${message.id}:`, error);
        }
    }
    /**
     * Collect data for a message
     * @param message Message to collect data for
     */
    async collectData(message) {
        try {
            const dataCollectors = this.pluginRegistry.getCapabilitiesByType('data-collector');
            if (dataCollectors.length === 0) {
                return {};
            }
            const collectedData = {};
            for (const collector of dataCollectors) {
                try {
                    const data = await collector.collectData(['finance', 'market'], { messageId: message.id });
                    collectedData[collector.id] = data;
                }
                catch (error) {
                    console.error(`Failed to collect data with ${collector.id}:`, error);
                }
            }
            return collectedData;
        }
        catch (error) {
            console.error('Failed to collect data:', error);
            return {};
        }
    }
    /**
     * Enhance a prompt
     * @param prompt Prompt to enhance
     * @param context Context for enhancement
     */
    async enhancePrompt(prompt, context) {
        try {
            const promptEnhancers = this.pluginRegistry.getCapabilitiesByType('prompt-enhancer');
            if (promptEnhancers.length === 0) {
                return prompt;
            }
            let enhancedPrompt = prompt;
            for (const enhancer of promptEnhancers) {
                try {
                    enhancedPrompt = await enhancer.enhancePrompt(enhancedPrompt, context, {});
                }
                catch (error) {
                    console.error(`Failed to enhance prompt with ${enhancer.id}:`, error);
                }
            }
            return enhancedPrompt;
        }
        catch (error) {
            console.error('Failed to enhance prompt:', error);
            return prompt;
        }
    }
    /**
     * Generate a response using LLM
     * @param prompt Prompt to generate response for
     */
    async generateResponse(prompt) {
        try {
            // In a real implementation, this would call an LLM API
            // For demonstration purposes, we'll return a mock response
            return `Here is a response to your query: "${prompt.substring(0, 50)}..."\n\n` +
                "I've analyzed the information and here's what I found...\n\n" +
                "```rust\nuse anchor_lang::prelude::*;\n\n#[program]\nmod example {\n    use super::*;\n    \n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}\n```";
        }
        catch (error) {
            console.error('Failed to generate response:', error);
            return "I'm sorry, I couldn't generate a response at this time.";
        }
    }
    /**
     * Process a response
     * @param response Response to process
     * @param context Context for processing
     */
    async processResponse(response, context) {
        try {
            const responseProcessors = this.pluginRegistry.getCapabilitiesByType('response-processor');
            if (responseProcessors.length === 0) {
                return response;
            }
            let processedResponse = response;
            for (const processor of responseProcessors) {
                try {
                    processedResponse = await processor.processResponse(processedResponse, context);
                }
                catch (error) {
                    console.error(`Failed to process response with ${processor.id}:`, error);
                }
            }
            return processedResponse;
        }
        catch (error) {
            console.error('Failed to process response:', error);
            return response;
        }
    }
    /**
     * Write a response to the blockchain
     * @param message Message to write response for
     * @param response Response to write
     */
    async writeResponse(message, response) {
        try {
            // In a real implementation, this would write to the blockchain
            // For demonstration purposes, we'll update the database
            await models_1.MessageModel.findByIdAndUpdate(message.id, {
                response,
                answered: true,
                answeredAt: new Date()
            });
            console.log(`Wrote response for message ${message.id}`);
        }
        catch (error) {
            console.error(`Failed to write response for message ${message.id}:`, error);
        }
    }
    /**
     * Get execution client state
     */
    async getExecutionClientState() {
        try {
            let state = await models_1.ExecutionClientStateModel.findOne({
                aiNft: process.env.AI_NFT || 'default'
            });
            // Create state if it doesn't exist
            if (!state) {
                state = await models_1.ExecutionClientStateModel.create({
                    aiNft: process.env.AI_NFT || 'default',
                    authority: this.wallet.publicKey.toString(),
                    totalProcessed: 0,
                    active: true,
                    supportedMessageTypes: ['text'],
                    lastUpdated: new Date()
                });
                console.log('Created execution client state');
            }
            return state;
        }
        catch (error) {
            console.error('Failed to get execution client state:', error);
            throw error;
        }
    }
    /**
     * Update execution client state
     */
    async updateExecutionClientState() {
        try {
            await models_1.ExecutionClientStateModel.findOneAndUpdate({ aiNft: process.env.AI_NFT || 'default' }, {
                lastUpdated: new Date(),
                $inc: { totalProcessed: 1 }
            });
        }
        catch (error) {
            console.error('Failed to update execution client state:', error);
        }
    }
}
exports.ExecutionClientService = ExecutionClientService;
