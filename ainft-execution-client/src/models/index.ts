import { prop, getModelForClass } from '@typegoose/typegoose';

/**
 * Message model
 */
export class Message {
  @prop({ required: true })
  public aiNft!: string;
  
  @prop({ required: true })
  public aiCharacter!: string;
  
  @prop({ required: true })
  public sender!: string;
  
  @prop({ required: true })
  public content!: string;
  
  @prop()
  public response?: string;
  
  @prop({ default: false })
  public answered!: boolean;
  
  @prop()
  public answeredAt?: Date;
  
  @prop({ default: Date.now })
  public createdAt!: Date;
}

/**
 * Execution client state model
 */
export class ExecutionClientState {
  @prop({ required: true })
  public aiNft!: string;
  
  @prop({ default: 0 })
  public totalProcessed!: number;
  
  @prop({ default: 0 })
  public totalCompute!: number;
  
  @prop({ default: 0 })
  public totalStaked!: number;
  
  @prop({ default: true })
  public active!: boolean;
  
  @prop({ type: () => [String], default: ['text'] })
  public supportedMessageTypes!: string[];
  
  @prop({ default: Date.now })
  public lastUpdated!: Date;
}

/**
 * Prompt enhancement model
 */
export class PromptEnhancement {
  @prop({ required: true })
  public messageId!: string;
  
  @prop({ required: true })
  public originalPrompt!: string;
  
  @prop({ required: true })
  public enhancedPrompt!: string;
  
  @prop({ type: () => [String] })
  public enhancers!: string[];
  
  @prop({ default: Date.now })
  public createdAt!: Date;
}

// Create models
export const MessageModel = getModelForClass(Message);
export const ExecutionClientStateModel = getModelForClass(ExecutionClientState);
export const PromptEnhancementModel = getModelForClass(PromptEnhancement);
