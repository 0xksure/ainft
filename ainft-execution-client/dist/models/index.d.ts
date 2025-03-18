/**
 * Message model
 */
export declare class Message {
    aiNft: string;
    aiCharacter: string;
    sender: string;
    content: string;
    response?: string;
    answered: boolean;
    answeredAt?: Date;
    createdAt: Date;
}
/**
 * Execution client state model
 */
export declare class ExecutionClientState {
    aiNft: string;
    totalProcessed: number;
    totalCompute: number;
    totalStaked: number;
    active: boolean;
    supportedMessageTypes: string[];
    lastUpdated: Date;
}
/**
 * Prompt enhancement model
 */
export declare class PromptEnhancement {
    messageId: string;
    originalPrompt: string;
    enhancedPrompt: string;
    enhancers: string[];
    createdAt: Date;
}
export declare const MessageModel: import("@typegoose/typegoose").ReturnModelType<typeof Message, import("@typegoose/typegoose/lib/types").BeAnObject>;
export declare const ExecutionClientStateModel: import("@typegoose/typegoose").ReturnModelType<typeof ExecutionClientState, import("@typegoose/typegoose/lib/types").BeAnObject>;
export declare const PromptEnhancementModel: import("@typegoose/typegoose").ReturnModelType<typeof PromptEnhancement, import("@typegoose/typegoose/lib/types").BeAnObject>;
