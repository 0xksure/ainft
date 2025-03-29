/**
 * Execution Client Service
 */
export declare class ExecutionClientService {
    private connection;
    private wallet;
    private program;
    private pluginRegistry;
    private pollingInterval;
    private running;
    constructor();
    /**
     * Initialize the execution client
     */
    initialize(): Promise<void>;
    /**
     * Start the execution client
     */
    start(): Promise<void>;
    /**
     * Stop the execution client
     */
    stop(): Promise<void>;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
    /**
     * Poll for new messages
     */
    private pollForNewMessages;
    /**
     * Get unanswered messages
     */
    private getUnansweredMessages;
    /**
     * Process a message
     * @param message Message to process
     */
    private processMessage;
    /**
     * Collect data for a message
     * @param message Message to collect data for
     */
    private collectData;
    /**
     * Enhance a prompt
     * @param prompt Prompt to enhance
     * @param context Context for enhancement
     */
    private enhancePrompt;
    /**
     * Generate a response using LLM
     * @param prompt Prompt to generate response for
     */
    private generateResponse;
    /**
     * Process a response
     * @param response Response to process
     * @param context Context for processing
     */
    private processResponse;
    /**
     * Write a response to the blockchain
     * @param message Message to write response for
     * @param response Response to write
     */
    private writeResponse;
    /**
     * Get execution client state
     */
    private getExecutionClientState;
    /**
     * Update execution client state
     */
    private updateExecutionClientState;
}
