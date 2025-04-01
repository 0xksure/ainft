import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up environment-specific logging
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevEnvironment = NODE_ENV === 'development' || NODE_ENV === 'dev';

/**
 * Interface for LLM Provider configuration
 */
export interface LLMProviderConfig {
  apiUrl: string;
  username?: string;
  password?: string;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Interface for LLM Provider
 */
export interface LLMProvider {
  generateCompletion(prompt: string, config: LLMProviderConfig): Promise<string>;
}

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements LLMProvider {
  async generateCompletion(prompt: string, config: LLMProviderConfig): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use API key if provided, otherwise use username/password
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.username && config.password) {
        const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      const response = await axios.post(
        `${config.apiUrl}/v1/chat/completions`,
        {
          model: config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
          top_p: config.topP || 1,
          frequency_penalty: config.frequencyPenalty || 0,
          presence_penalty: config.presencePenalty || 0,
        },
        { headers }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI provider error:', error);
      throw new Error(`OpenAI provider error: ${error}`);
    }
  }
}

/**
 * Anthropic Provider Implementation
 */
export class AnthropicProvider implements LLMProvider {
  async generateCompletion(prompt: string, config: LLMProviderConfig): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use API key if provided, otherwise use username/password
      if (config.apiKey) {
        headers['x-api-key'] = config.apiKey;
        // Anthropic also uses this header format
        headers['anthropic-version'] = '2023-06-01';
      } else if (config.username && config.password) {
        const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      const response = await axios.post(
        `${config.apiUrl}/v1/messages`,
        {
          model: config.model || 'claude-2',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
          top_p: config.topP || 1,
        },
        { headers }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Anthropic provider error:', error);
      throw new Error(`Anthropic provider error: ${error}`);
    }
  }
}

/**
 * Generic Provider Implementation for other API-compatible services
 */
export class GenericProvider implements LLMProvider {
  async generateCompletion(prompt: string, config: LLMProviderConfig): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use API key if provided, otherwise use username/password
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.username && config.password) {
        const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      const response = await axios.post(
        config.apiUrl,
        {
          model: config.model || 'default',
          prompt: prompt,
          max_tokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
          top_p: config.topP || 1,
        },
        { headers }
      );

      // Handle different response formats
      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].text || response.data.choices[0].message?.content;
      } else if (response.data.content) {
        return response.data.content;
      } else if (response.data.response) {
        return response.data.response;
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.error('Generic provider error:', error);
      throw new Error(`Generic provider error: ${error}`);
    }
  }
}

/**
 * LLM Service
 */
export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;
  private config: LLMProviderConfig;

  constructor(config?: LLMProviderConfig) {
    // Register providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('generic', new GenericProvider());

    // Set default provider
    this.defaultProvider = process.env.LLM_PROVIDER || 'openai';

    // Set default config
    this.config = config || {
      apiUrl: process.env.LLM_API_URL || 'https://api.openai.com',
      apiKey: process.env.LLM_API_KEY,
      username: process.env.LLM_USERNAME,
      password: process.env.LLM_PASSWORD,
      model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      topP: parseFloat(process.env.LLM_TOP_P || '1'),
      frequencyPenalty: parseFloat(process.env.LLM_FREQUENCY_PENALTY || '0'),
      presencePenalty: parseFloat(process.env.LLM_PRESENCE_PENALTY || '0'),
    };

    if (isDevEnvironment) {
      console.log('Initialized LLM service with provider:', this.defaultProvider);
    }
  }

  /**
   * Set the configuration for the LLM service
   * @param config Configuration for the LLM service
   */
  setConfig(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set the default provider
   * @param provider Provider name
   */
  setDefaultProvider(provider: string): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not found`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Register a new provider
   * @param name Provider name
   * @param provider Provider implementation
   */
  registerProvider(name: string, provider: LLMProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Generate a completion using the default provider
   * @param prompt Prompt to generate completion for
   * @param providerName Optional provider name to use
   * @returns Generated completion
   */
  async generateCompletion(prompt: string, providerName?: string): Promise<string> {
    const provider = this.providers.get(providerName || this.defaultProvider);
    
    if (!provider) {
      throw new Error(`Provider ${providerName || this.defaultProvider} not found`);
    }

    return provider.generateCompletion(prompt, this.config);
  }
}

// Export singleton instance
export const llmService = new LLMService();
