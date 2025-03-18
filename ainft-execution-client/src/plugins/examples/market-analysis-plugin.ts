import axios from "axios";
import { 
  ExecutionClientPlugin, 
  PluginContext, 
  PluginCapability,
  DataCollectionCapability,
  PromptEnhancementCapability
} from "../interfaces";

// Market data collection capability
class MarketDataCollectionCapability implements DataCollectionCapability {
  id = "market-data-collector";
  name = "Market Data Collector";
  type = "data-collector" as const;
  supportedSources = ["finance", "market", "stocks", "crypto"];
  
  private apiKey: string;
  private logger: any;
  
  constructor(apiKey: string, logger: any) {
    this.apiKey = apiKey;
    this.logger = logger;
  }
  
  async collectData(
    sources: string[],
    parameters: Record<string, any>
  ): Promise<any> {
    try {
      this.logger.info(`Collecting market data for sources: ${sources.join(", ")}`);
      
      // Extract symbols from parameters
      const symbols = parameters.symbols || ["AAPL", "MSFT", "GOOGL"];
      
      // Collect stock data
      const stockData = await this.collectStockData(symbols);
      
      // Collect crypto data if requested
      let cryptoData: Record<string, any> = {};
      if (sources.includes("crypto")) {
        cryptoData = await this.collectCryptoData(
          parameters.cryptoSymbols || ["BTC", "ETH", "SOL"]
        );
      }
      
      return {
        stocks: stockData,
        crypto: cryptoData,
        collectedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Failed to collect market data:", error);
      throw error;
    }
  }
  
  private async collectStockData(symbols: string[]): Promise<Record<string, any>> {
    // In a real implementation, this would call a financial API
    // For demonstration purposes, we'll return mock data
    return symbols.reduce((acc: Record<string, any>, symbol) => {
      acc[symbol] = {
        price: Math.random() * 1000,
        change: (Math.random() * 10) - 5,
        volume: Math.floor(Math.random() * 10000000),
      };
      return acc;
    }, {});
  }
  
  private async collectCryptoData(symbols: string[]): Promise<Record<string, any>> {
    // In a real implementation, this would call a crypto API
    // For demonstration purposes, we'll return mock data
    return symbols.reduce((acc: Record<string, any>, symbol) => {
      acc[symbol] = {
        price: Math.random() * 50000,
        change24h: (Math.random() * 20) - 10,
        marketCap: Math.floor(Math.random() * 1000000000),
      };
      return acc;
    }, {});
  }
}

// Market prompt enhancement capability
class MarketPromptEnhancementCapability implements PromptEnhancementCapability {
  id = "market-prompt-enhancer";
  name = "Market Prompt Enhancer";
  type = "prompt-enhancer" as const;
  supportedDomains = ["finance", "market", "stocks", "crypto"];
  
  private logger: any;
  
  constructor(logger: any) {
    this.logger = logger;
  }
  
  async enhancePrompt(
    prompt: string,
    context: any,
    parameters: Record<string, any>
  ): Promise<string> {
    try {
      this.logger.info(`Enhancing prompt with market data for message ${context.messageId}`);
      
      // Get collected data
      const marketData = context.collectedData?.["market-data-collector"];
      
      if (!marketData) {
        this.logger.warn("No market data available for enhancement");
        return prompt;
      }
      
      // Create market data summary
      const marketSummary = this.createMarketSummary(marketData);
      
      // Enhance prompt with market data
      return `${prompt}\n\nHere is some relevant market data that might help with your analysis:\n${marketSummary}`;
    } catch (error) {
      this.logger.error("Failed to enhance prompt with market data:", error);
      return prompt;
    }
  }
  
  private createMarketSummary(marketData: any): string {
    let summary = "## Market Data Summary\n\n";
    
    // Add stock data
    if (marketData.stocks && Object.keys(marketData.stocks).length > 0) {
      summary += "### Stock Prices\n";
      for (const [symbol, data] of Object.entries(marketData.stocks)) {
        const stockData = data as any;
        summary += `- ${symbol}: $${stockData.price.toFixed(2)} (${stockData.change > 0 ? "+" : ""}${stockData.change.toFixed(2)}%)\n`;
      }
      summary += "\n";
    }
    
    // Add crypto data
    if (marketData.crypto && Object.keys(marketData.crypto).length > 0) {
      summary += "### Cryptocurrency Prices\n";
      for (const [symbol, data] of Object.entries(marketData.crypto)) {
        const cryptoData = data as any;
        summary += `- ${symbol}: $${cryptoData.price.toFixed(2)} (${cryptoData.change24h > 0 ? "+" : ""}${cryptoData.change24h.toFixed(2)}% 24h)\n`;
      }
      summary += "\n";
    }
    
    summary += `Data collected at: ${marketData.collectedAt}\n`;
    
    return summary;
  }
}

// Market Analysis Plugin
export default class MarketAnalysisPlugin implements ExecutionClientPlugin {
  id = "market-analysis-plugin";
  name = "Market Analysis Plugin";
  version = "1.0.0";
  
  private context: PluginContext | null = null;
  private capabilities: PluginCapability[] = [];
  
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    
    // Get API key from config
    const apiKey = context.config.marketApiKey || "demo-api-key";
    
    // Create capabilities
    this.capabilities = [
      new MarketDataCollectionCapability(apiKey, context.logger),
      new MarketPromptEnhancementCapability(context.logger),
    ];
    
    context.logger.info(`${this.name} initialized successfully`);
  }
  
  async cleanup(): Promise<void> {
    if (this.context) {
      this.context.logger.info(`${this.name} cleaned up successfully`);
    }
    
    this.capabilities = [];
    this.context = null;
  }
  
  getCapabilities(): PluginCapability[] {
    return this.capabilities;
  }
}
