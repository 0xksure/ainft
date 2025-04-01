import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import fs from 'fs';
import { PluginRegistry } from '../plugins/registry';
import { DatabaseService } from './database';
import { MessageModel, ExecutionClientStateModel, Message } from '../models';
import dotenv from 'dotenv';
import IDL from '../../../target/idl/ainft.json'
import { Ainft } from '../../../target/types/ainft'
import * as anchor from '@coral-xyz/anchor';
import { LLMService, llmService } from './llm-service';

// Load environment variables
dotenv.config();

// Set up environment-specific logging
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevEnvironment = NODE_ENV === 'development' || NODE_ENV === 'dev';


export function findAppAinftPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("app_ainft")],
    programId
  );
}

/**
 * Execution Client Service
 */
export class ExecutionClientService {
  private connection: Connection;
  private wallet: Wallet;
  private program: Program<Ainft>;
  private pluginRegistry: PluginRegistry;
  private pollingInterval: NodeJS.Timeout | null = null;
  private running: boolean = false;

  constructor() {
    // Create Solana connection
    const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Load keypair
    const keypairPath = process.env.KEYPAIR_PATH || './keypair.json';
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

    // Create wallet and provider
    this.wallet = new Wallet(keypair);
    const provider = new AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: 'confirmed' }
    );

    // Create program with IDL
    this.program = new Program(
      IDL,
      provider
    );

    // Create plugin registry
    this.pluginRegistry = new PluginRegistry({
      config: {
        connection: this.connection,
        program: this.program,
        wallet: this.wallet
      },
      logger: console
    });

    if (isDevEnvironment) {
      console.log('Loaded keypair from', keypairPath);
      console.log('Created Solana connection to', rpcUrl);
      console.log('Created wallet with public key', this.wallet.publicKey.toString());
      console.log('Created program with IDL', IDL);
      console.log('Created plugin registry');
    }
  }

  /**
   * Initialize the execution client
   */
  async initialize(): Promise<void> {
    try {
      // Connect to database
      await DatabaseService.getInstance().connect();

      if (isDevEnvironment) {
        console.log('Connected to database');
      }

      // Load plugins
      await this.pluginRegistry.loadPluginsFromDirectory(
        process.env.PLUGINS_DIR || './plugins'
      );

      if (isDevEnvironment) {
        console.log('Loaded plugins from directory', process.env.PLUGINS_DIR || './plugins');
      }

      // Initialize execution client state
      await this.getExecutionClientState();

      console.log('Execution client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize execution client:', error);
      throw error;
    }
  }

  /**
   * Start the execution client
   */
  async start(): Promise<void> {
    if (this.running) {
      console.log('Execution client is already running');
      return;
    }

    try {
      // Start polling for new messages
      const pollingIntervalMs = parseInt(process.env.POLLING_INTERVAL || '1000', 10);

      this.pollingInterval = setInterval(
        () => this.pollForNewMessages(),
        pollingIntervalMs
      );

      this.running = true;

      console.log(`Execution client started with polling interval ${pollingIntervalMs}ms`);
    } catch (error) {
      console.error('Failed to start execution client:', error);
      throw error;
    }
  }

  /**
   * Stop the execution client
   */
  async stop(): Promise<void> {
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
    } catch (error) {
      console.error('Failed to stop execution client:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Stop polling
      await this.stop();

      // Clean up plugins
      await this.pluginRegistry.cleanup();

      // Disconnect from database
      await DatabaseService.getInstance().disconnect();

      console.log('Execution client cleaned up successfully');
    } catch (error) {
      console.error('Failed to clean up execution client:', error);
      throw error;
    }
  }

  /**
   * Poll for new messages
   */
  private async pollForNewMessages(): Promise<void> {
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
    } catch (error) {
      console.error('Failed to poll for new messages:', error);
    }
  }

  /**
   * Convert a blockchain message to the Message interface format
   * @param blockchainMessage Message from the blockchain
   * @returns Message in the correct format
   */
  private convertBlockchainMessageToModel(blockchainMessage: any): Message {
    return {
      aiNft: blockchainMessage.account.aiNft.toString(),
      aiCharacter: blockchainMessage.account.aiCharacter.toString(),
      sender: blockchainMessage.account.sender.toString(),
      content: blockchainMessage.account.content,
      response: blockchainMessage.account.response || undefined,
      answered: blockchainMessage.account.answered,
      createdAt: new Date(), // Blockchain doesn't have timestamp, use current time
      // Store the original message publicKey as a custom property for reference
      publicKey: blockchainMessage.publicKey.toString()
    } as Message;
  }

  /**
   * Get unanswered messages
   */
  private async getUnansweredMessages(): Promise<Message[]> {
    try {
      console.log('[DEBUG] Starting getUnansweredMessages method');
      // Step 1: Get all AI characters that have this execution client as their primary client
      const myPublicKey = this.wallet.publicKey;
      let [appAinftPda] = findAppAinftPDA(this.program.programId);
      const [myExecutionClient, executionClientBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("execution_client"), appAinftPda.toBuffer(), this.wallet.publicKey.toBuffer()],
        this.program.programId
      );

      console.log('[DEBUG] App AINFT PDA:', appAinftPda.toString());
      console.log('[DEBUG] My Execution Client PDA:', myExecutionClient.toString());

      if (isDevEnvironment) {
        console.log('Execution client public key:', myPublicKey.toString());
      }

      // Fetch all AI character NFTs
      console.log('[DEBUG] Fetching all AI character NFTs');
      const aiCharacters = await this.program.account.aiCharacterNft.all();

      if (isDevEnvironment) {
        console.log(`Found ${aiCharacters.length} total AI characters`);
      }

      // Filter AI characters that have this execution client as their primary client
      const myAiCharacters = aiCharacters.filter(item => {
        const executionClientPubkey = item.account.executionClient.toString();
        const isMyClient = executionClientPubkey === myExecutionClient.toString();

        if (isDevEnvironment) {
          console.log(`AI Character: ${item.publicKey.toString()}`);
          console.log(`- Execution Client: ${executionClientPubkey}`);
          console.log(`- Is My Client: ${isMyClient}`);
        }

        return isMyClient;
      });

      if (isDevEnvironment) {
        console.log(`Found ${myAiCharacters.length} AI characters assigned to this execution client`);
      }

      if (myAiCharacters.length === 0) {
        console.log('[DEBUG] No AI characters found for this execution client');
        return [];
      }

      // Step 2: Get all unanswered messages for these AI characters
      const allMessages = [];

      for (const aiCharacter of myAiCharacters) {
        try {
          // Fetch messages for this AI character
          const aiCharacterPubkey = aiCharacter.publicKey;

          if (isDevEnvironment) {
            console.log(`Fetching messages for AI character: ${aiCharacterPubkey.toString()}`);
          }

          // Fetch all messages for the specific AI NFT
          console.log(`[DEBUG] Fetching messages for AI character: ${aiCharacterPubkey.toString()}`);
          try {
            const messages = await this.program.account.messageAiCharacter.all();

            console.log(`[DEBUG] Successfully fetched ${messages.length} messages`);

            if (isDevEnvironment) {
              console.log(`Found ${messages.length} total messages for AI character ${aiCharacterPubkey.toString()}`);
            }

            // Filter for unanswered messages
            const unansweredMessages = messages.filter(msg => !msg.account.answered);

            if (isDevEnvironment) {
              console.log(`Found ${unansweredMessages.length} unanswered messages for AI character ${aiCharacterPubkey.toString()}`);
            }

            // Add to our collection
            allMessages.push(...unansweredMessages);
          } catch (fetchError) {
            console.error(`[DEBUG] Error fetching messages for AI character: ${aiCharacterPubkey.toString()}`, fetchError);
            throw fetchError; // Re-throw to be caught by the outer try-catch
          }
        } catch (error) {
          console.error(`Error fetching messages for AI character ${aiCharacter.publicKey.toString()}:`, error);
          // Log additional details about the error
          if (error instanceof RangeError) {
            console.error(`[DEBUG] Buffer range error details - code: ${error}, message: ${error.message}`);
            if (error.stack) {
              console.error(`[DEBUG] Error stack trace: ${error.stack}`);
            }
          }
          // Continue with other AI characters even if one fails
        }
      }

      // Sort messages by timestamp (if available)
      console.log(`[DEBUG] Sorting ${allMessages.length} messages`);
      const sortedMessages = allMessages.sort((a, b) => {
        // If there's a timestamp field, sort by it
        return 0; // No sorting if no timestamp
      });

      if (isDevEnvironment) {
        console.log(`Found ${sortedMessages.length} total unanswered messages for all my AI characters`);
      }

      // Convert blockchain messages to the Message interface format with error handling
      console.log(`[DEBUG] Converting ${sortedMessages.length} blockchain messages to model format`);
      const convertedBlockchainMessages = [];
      for (const msg of sortedMessages) {
        try {
          console.log(`[DEBUG] Converting message: ${msg.publicKey.toString()}`);
          console.log(`[DEBUG] Message account data size: ${Object.keys(msg.account).length} properties`);

          // Log the structure of the message account
          console.log('[DEBUG] Message account structure:', JSON.stringify({
            aiNft: msg.account.aiNft?.toString() || 'undefined',
            aiCharacter: msg.account.aiCharacter?.toString() || 'undefined',
            sender: msg.account.sender?.toString() || 'undefined',
            contentLength: msg.account.content?.length || 0,
            answered: msg.account.answered || false
          }));

          const convertedMsg = this.convertBlockchainMessageToModel(msg);
          convertedBlockchainMessages.push(convertedMsg);
          console.log(`[DEBUG] Successfully converted message ${msg.publicKey.toString()}`);
        } catch (error) {
          console.error('[DEBUG] Error converting blockchain message to model:', error);
          if (error instanceof RangeError) {
            console.error(`[DEBUG] Buffer data error - code: ${error}, message: ${error.message}`);
            // Try to log information about the buffer
            try {
              console.error(`[DEBUG] Message public key: ${msg.publicKey.toString()}`);
              console.error(`[DEBUG] Message account data available: ${!!msg.account}`);
              if (msg.account) {
                console.error(`[DEBUG] Message account keys: ${Object.keys(msg.account).join(', ')}`);
              }
            } catch (logError) {
              console.error('[DEBUG] Error while trying to log message details:', logError);
            }
          }
          // Skip this message and continue with others
        }
      }

      // For backward compatibility, also check the database
      console.log('[DEBUG] Checking database for unanswered messages');
      const dbMessages = await MessageModel.find({
        answered: false
      }).limit(10);

      if (isDevEnvironment) {
        console.log(`Found ${dbMessages.length} unanswered messages in the database`);
      }

      // Combine messages from blockchain and database
      const combinedMessages = [...convertedBlockchainMessages, ...dbMessages];

      if (isDevEnvironment) {
        console.log(`Total unanswered messages: ${combinedMessages.length}`);
      }

      console.log('[DEBUG] Completed getUnansweredMessages method successfully');
      return combinedMessages;
    } catch (error) {
      console.error('[DEBUG] Top-level error in getUnansweredMessages:', error);
      if (error instanceof RangeError) {
        console.error(`[DEBUG] Top-level buffer range error - code: ${error}, message: ${error.message}`);
        console.error(`[DEBUG] Error stack: ${error.stack}`);
      }
      console.error('Failed to get unanswered messages:', error);

      // Fallback to database if blockchain query fails
      try {
        console.warn('[DEBUG] Falling back to database for messages');
        const messages = await MessageModel.find({
          answered: false
        }).limit(10);

        return messages;
      } catch (dbError) {
        console.error('[DEBUG] Database fallback also failed:', dbError);
        return [];
      }
    }
  }

  /**
   * Process a message
   * @param message Message to process
   */
  private async processMessage(message: Message): Promise<void> {
    try {
      console.log(`Processing message for AI character: ${message.aiCharacter}`);

      // Collect data for the message
      const collectedData = await this.collectData(message);

      // Enhance the prompt
      const enhancedPrompt = await this.enhancePrompt(
        message.content,
        { messageId: message.id || message.publicKey, collectedData }
      );

      // Generate response using LLM
      const response = await this.generateResponse(enhancedPrompt);

      // Process the response
      const processedResponse = await this.processResponse(
        response,
        { messageId: message.id || message.publicKey, collectedData }
      );

      // Write response to blockchain
      await this.writeResponse(message, processedResponse);

      console.log(`Processed message for AI character: ${message.aiCharacter}`);
    } catch (error) {
      console.error(`Failed to process message for AI character ${message.aiCharacter}:`, error);
    }
  }

  /**
   * Collect data for a message
   * @param message Message to collect data for
   */
  private async collectData(message: any): Promise<Record<string, any>> {
    try {
      const dataCollectors = this.pluginRegistry.getCapabilitiesByType('data-collector');

      if (dataCollectors.length === 0) {
        return {};
      }

      const collectedData: Record<string, any> = {};

      for (const collector of dataCollectors) {
        try {
          const data = await (collector as any).collectData(
            ['finance', 'market'],
            { messageId: message.id || message.publicKey }
          );

          collectedData[collector.id] = data;

          if (isDevEnvironment) {
            console.log(`Collected data with ${collector.id}`);
          }
        } catch (error) {
          console.error(`Failed to collect data with ${collector.id}:`, error);
        }
      }

      return collectedData;
    } catch (error) {
      console.error('Failed to collect data:', error);
      return {};
    }
  }

  /**
   * Enhance a prompt
   * @param prompt Prompt to enhance
   * @param context Context for enhancement
   */
  private async enhancePrompt(
    prompt: string,
    context: any
  ): Promise<string> {
    try {
      const promptEnhancers = this.pluginRegistry.getCapabilitiesByType('prompt-enhancer');

      if (promptEnhancers.length === 0) {
        return prompt;
      }

      let enhancedPrompt = prompt;

      for (const enhancer of promptEnhancers) {
        try {
          enhancedPrompt = await (enhancer as any).enhancePrompt(
            enhancedPrompt,
            context,
            {}
          );

          if (isDevEnvironment) {
            console.log(`Enhanced prompt with ${enhancer.id}`);
          }
        } catch (error) {
          console.error(`Failed to enhance prompt with ${enhancer.id}:`, error);
        }
      }

      return enhancedPrompt;
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
      return prompt;
    }
  }

  /**
   * Generate a response using LLM
   * @param prompt Prompt to generate response for
   */
  private async generateResponse(prompt: string): Promise<string> {
    try {
      if (isDevEnvironment) {
        console.log('Generating response for prompt:', prompt);
      }

      // Use the LLM service to generate a response
      const response = await llmService.generateCompletion(prompt);

      if (isDevEnvironment) {
        console.log('Generated response:', response.substring(0, 100) + '...');
      }

      return response;
    } catch (error) {
      console.error('Failed to generate response:', error);
      return "I'm sorry, I couldn't generate a response at this time.";
    }
  }

  /**
   * Process a response
   * @param response Response to process
   * @param context Context for processing
   */
  private async processResponse(
    response: string,
    context: any
  ): Promise<string> {
    try {
      const responseProcessors = this.pluginRegistry.getCapabilitiesByType('response-processor');

      if (responseProcessors.length === 0) {
        return response;
      }

      let processedResponse = response;

      for (const processor of responseProcessors) {
        try {
          processedResponse = await (processor as any).processResponse(
            processedResponse,
            context
          );

          if (isDevEnvironment) {
            console.log(`Processed response with ${processor.id}`);
          }
        } catch (error) {
          console.error(`Failed to process response with ${processor.id}:`, error);
        }
      }

      return processedResponse;
    } catch (error) {
      console.error('Failed to process response:', error);
      return response;
    }
  }

  /**
   * Write a response to the blockchain
   * @param message Message to write response for
   * @param response Response to write
   */
  private async writeResponse(message: Message, response: string): Promise<void> {
    try {
      // Check if this is a blockchain message or a database message
      if (message.publicKey) {
        // This is a blockchain message
        if (isDevEnvironment) {
          console.log(`Writing response to blockchain for message at address: ${message.publicKey}`);
        }

        // Find the app ainft PDA
        const [appAinftPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("app_ainft")],
          this.program.programId
        );

        if (isDevEnvironment) {
          console.log(`App AiNft PDA: ${appAinftPda.toString()}`);
        }

        // Get the AI character account to access its compute token account
        const aiCharacter = new PublicKey(message.aiCharacter);
        const aiCharacterAccount = await this.program.account.aiCharacterNft.fetch(aiCharacter);
        const aiCharacterComputeTokenAccount = aiCharacterAccount.computeTokenAccount;

        if (isDevEnvironment) {
          console.log(`AI Character Compute Token Account: ${aiCharacterComputeTokenAccount.toString()}`);
        }

        // Find the compute mint PDA
        const [computeMint] = PublicKey.findProgramAddressSync(
          [Buffer.from("compute_mint"), appAinftPda.toBuffer()],
          this.program.programId
        );

        if (isDevEnvironment) {
          console.log(`Compute Mint: ${computeMint.toString()}`);
        }

        // Find the execution client PDA
        const [executionClient] = PublicKey.findProgramAddressSync(
          [Buffer.from("execution_client"), appAinftPda.toBuffer(), this.wallet.publicKey.toBuffer()],
          this.program.programId
        );

        if (isDevEnvironment) {
          console.log(`Execution Client: ${executionClient.toString()}`);
        }

        // Get the execution client compute token account
        const executionClientComputeAccount = await anchor.utils.token.associatedAddress({
          mint: computeMint,
          owner: executionClient
        });

        if (isDevEnvironment) {
          console.log(`Execution Client Compute Account: ${executionClientComputeAccount.toString()}`);
        }

        // Find the staked token account
        const stakedTokenAccount = await anchor.utils.token.associatedAddress({
          mint: computeMint,
          owner: appAinftPda
        });

        if (isDevEnvironment) {
          console.log(`Staked Token Account: ${stakedTokenAccount.toString()}`);
        }

        // Find the staker PDA
        const [staker] = PublicKey.findProgramAddressSync(
          [Buffer.from("staker"), executionClient.toBuffer(), this.wallet.publicKey.toBuffer()],
          this.program.programId
        );

        if (isDevEnvironment) {
          console.log(`Staker: ${staker.toString()}`);
        }

        // Prepare the response object
        const writeResponse = {
          content: response,
          actions: [],
        };

        // Call the writeResponse instruction on the program
        try {
          const tx = await this.program.methods
            .writeResponse(writeResponse)
            .accounts({
              message: new PublicKey(message.publicKey),
              aiNft: appAinftPda,
              aiCharacterNft: aiCharacter,
              aiCharacterComputeTokenAccount: aiCharacterComputeTokenAccount,
              stakedTokenAccount: stakedTokenAccount,
              executionClient: executionClient,
              computeMint: computeMint,
              executionClientComputeTokenAddress: executionClientComputeAccount,
              authority: this.wallet.publicKey,
              tokenAAccount: null,
              tokenBAccount: null,
              poolProgram: null,
            })
            .rpc();

          if (isDevEnvironment) {
            console.log(`Transaction submitted: ${tx}`);
            console.log(`Answered blockchain message at address: ${message.publicKey}`);
          }
        } catch (txError) {
          console.error('Failed to submit blockchain transaction:', txError);
          throw txError;
        }
      } else {
        // This is a database message
        if (isDevEnvironment) {
          console.log(`Writing response to database for message ID: ${message.id}`);
        }

        await MessageModel.findByIdAndUpdate(message.id, {
          response,
          answered: true,
          answeredAt: new Date()
        });

        if (isDevEnvironment) {
          console.log(`Updated database message ${message.id}`);
        }
      }

      console.log(`Wrote response for message ${message.id || message.publicKey}`);
    } catch (error) {
      console.error(`Failed to write response for message ${message.id || message.publicKey || 'unknown'}:`, error);
    }
  }

  /**
   * Get execution client state
   */
  private async getExecutionClientState(): Promise<any> {
    try {
      let state = await ExecutionClientStateModel.findOne({
        aiNft: process.env.AI_NFT || 'default'
      });

      // Create state if it doesn't exist
      if (!state) {
        state = await ExecutionClientStateModel.create({
          aiNft: process.env.AI_NFT || 'default',
          authority: this.wallet.publicKey.toString(),
          totalProcessed: 0,
          active: true,
          supportedMessageTypes: ['text'],
          lastUpdated: new Date()
        });

        console.log('Created execution client state');
      }

      if (isDevEnvironment) {
        console.log('Fetched execution client state');
      }

      return state;
    } catch (error) {
      console.error('Failed to get execution client state:', error);
      throw error;
    }
  }

  /**
   * Update execution client state
   */
  private async updateExecutionClientState(): Promise<void> {
    try {
      await ExecutionClientStateModel.findOneAndUpdate(
        { aiNft: process.env.AI_NFT || 'default' },
        {
          lastUpdated: new Date(),
          $inc: { totalProcessed: 1 }
        }
      );

      if (isDevEnvironment) {
        console.log('Updated execution client state');
      }
    } catch (error) {
      console.error('Failed to update execution client state:', error);
    }
  }
}
