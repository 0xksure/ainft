/**
 * Plugin interfaces for the ainFT Execution Client
 */
/**
 * Context provided to plugins during initialization
 */
export interface PluginContext {
    config: Record<string, any>;
    logger: any;
}
/**
 * Base interface for all plugin capabilities
 */
export interface PluginCapability {
    id: string;
    name: string;
    type: string;
}
/**
 * Data collection capability for gathering specialized data
 */
export interface DataCollectionCapability extends PluginCapability {
    type: 'data-collector';
    supportedSources: string[];
    collectData(sources: string[], parameters: Record<string, any>): Promise<any>;
}
/**
 * Prompt enhancement capability for improving prompts with specialized knowledge
 */
export interface PromptEnhancementCapability extends PluginCapability {
    type: 'prompt-enhancer';
    supportedDomains: string[];
    enhancePrompt(prompt: string, context: any, parameters: Record<string, any>): Promise<string>;
}
/**
 * Response processing capability for modifying AI responses
 */
export interface ResponseProcessingCapability extends PluginCapability {
    type: 'response-processor';
    processResponse(response: string, context: any): Promise<string>;
}
/**
 * Blockchain interaction capability for executing transactions
 */
export interface BlockchainInteractionCapability extends PluginCapability {
    type: 'blockchain-interaction';
    executeCPI(programName: string, instruction: string, accounts: any[], data: any): Promise<any>;
    deploySmartContract?(code: string, options: Record<string, any>): Promise<any>;
}
/**
 * Main plugin interface that all execution client plugins must implement
 */
export interface ExecutionClientPlugin {
    id: string;
    name: string;
    version: string;
    initialize(context: PluginContext): Promise<void>;
    cleanup(): Promise<void>;
    getCapabilities(): PluginCapability[];
}
