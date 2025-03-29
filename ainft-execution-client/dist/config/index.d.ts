export interface ExecutionClientConfig {
    rpcUrl: string;
    programId: string;
    keypairPath: string;
    llmProvider: string;
    llmApiKey: string;
    llmModel: string;
    pollingInterval: number;
    maxRetries: number;
    retryDelay: number;
    mongodbUri: string;
    pluginsDir: string;
    logLevel: string;
}
export declare const config: ExecutionClientConfig;
