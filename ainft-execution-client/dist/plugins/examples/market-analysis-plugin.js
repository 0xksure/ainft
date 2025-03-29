"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Market data collection capability
class MarketDataCollectionCapability {
    constructor(apiKey, logger) {
        this.id = "market-data-collector";
        this.name = "Market Data Collector";
        this.type = "data-collector";
        this.supportedSources = ["finance", "market", "stocks", "crypto"];
        this.apiKey = apiKey;
        this.logger = logger;
    }
    async collectData(sources, parameters) {
        try {
            this.logger.info(`Collecting market data for sources: ${sources.join(", ")}`);
            // Extract symbols from parameters
            const symbols = parameters.symbols || ["AAPL", "MSFT", "GOOGL"];
            // Collect stock data
            const stockData = await this.collectStockData(symbols);
            // Collect crypto data if requested
            let cryptoData = {};
            if (sources.includes("crypto")) {
                cryptoData = await this.collectCryptoData(parameters.cryptoSymbols || ["BTC", "ETH", "SOL"]);
            }
            return {
                stocks: stockData,
                crypto: cryptoData,
                collectedAt: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error("Failed to collect market data:", error);
            throw error;
        }
    }
    async collectStockData(symbols) {
        // In a real implementation, this would call a financial API
        // For demonstration purposes, we'll return mock data
        return symbols.reduce((acc, symbol) => {
            acc[symbol] = {
                price: Math.random() * 1000,
                change: (Math.random() * 10) - 5,
                volume: Math.floor(Math.random() * 10000000),
            };
            return acc;
        }, {});
    }
    async collectCryptoData(symbols) {
        // In a real implementation, this would call a crypto API
        // For demonstration purposes, we'll return mock data
        return symbols.reduce((acc, symbol) => {
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
class MarketPromptEnhancementCapability {
    constructor(logger) {
        this.id = "market-prompt-enhancer";
        this.name = "Market Prompt Enhancer";
        this.type = "prompt-enhancer";
        this.supportedDomains = ["finance", "market", "stocks", "crypto"];
        this.logger = logger;
    }
    async enhancePrompt(prompt, context, parameters) {
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
        }
        catch (error) {
            this.logger.error("Failed to enhance prompt with market data:", error);
            return prompt;
        }
    }
    createMarketSummary(marketData) {
        let summary = "## Market Data Summary\n\n";
        // Add stock data
        if (marketData.stocks && Object.keys(marketData.stocks).length > 0) {
            summary += "### Stock Prices\n";
            for (const [symbol, data] of Object.entries(marketData.stocks)) {
                const stockData = data;
                summary += `- ${symbol}: $${stockData.price.toFixed(2)} (${stockData.change > 0 ? "+" : ""}${stockData.change.toFixed(2)}%)\n`;
            }
            summary += "\n";
        }
        // Add crypto data
        if (marketData.crypto && Object.keys(marketData.crypto).length > 0) {
            summary += "### Cryptocurrency Prices\n";
            for (const [symbol, data] of Object.entries(marketData.crypto)) {
                const cryptoData = data;
                summary += `- ${symbol}: $${cryptoData.price.toFixed(2)} (${cryptoData.change24h > 0 ? "+" : ""}${cryptoData.change24h.toFixed(2)}% 24h)\n`;
            }
            summary += "\n";
        }
        summary += `Data collected at: ${marketData.collectedAt}\n`;
        return summary;
    }
}
// Market Analysis Plugin
class MarketAnalysisPlugin {
    constructor() {
        this.id = "market-analysis-plugin";
        this.name = "Market Analysis Plugin";
        this.version = "1.0.0";
        this.context = null;
        this.capabilities = [];
    }
    async initialize(context) {
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
    async cleanup() {
        if (this.context) {
            this.context.logger.info(`${this.name} cleaned up successfully`);
        }
        this.capabilities = [];
        this.context = null;
    }
    getCapabilities() {
        return this.capabilities;
    }
}
exports.default = MarketAnalysisPlugin;
