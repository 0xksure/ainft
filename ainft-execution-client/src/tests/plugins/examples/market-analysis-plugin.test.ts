import MarketAnalysisPlugin from "../../../plugins/examples/market-analysis-plugin";
import { PluginContext } from "../../../plugins/interfaces";

describe("MarketAnalysisPlugin", () => {
  let plugin: MarketAnalysisPlugin;
  let mockContext: PluginContext;
  
  beforeEach(() => {
    // Create mock logger
    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    // Create mock context
    mockContext = {
      config: {
        marketApiKey: "test-api-key"
      },
      logger: mockLogger
    };
    
    // Create plugin instance
    plugin = new MarketAnalysisPlugin();
  });
  
  test("should initialize correctly", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Verify that the plugin has capabilities
    const capabilities = plugin.getCapabilities();
    
    expect(capabilities).toHaveLength(2);
    
    // Verify that the plugin has the expected capabilities
    const dataCollector = capabilities.find(cap => cap.type === "data-collector");
    const promptEnhancer = capabilities.find(cap => cap.type === "prompt-enhancer");
    
    expect(dataCollector).toBeDefined();
    expect(promptEnhancer).toBeDefined();
    
    expect(dataCollector?.id).toBe("market-data-collector");
    expect(promptEnhancer?.id).toBe("market-prompt-enhancer");
  });
  
  test("should clean up correctly", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Clean up the plugin
    await plugin.cleanup();
    
    // Verify that the plugin has no capabilities
    const capabilities = plugin.getCapabilities();
    
    expect(capabilities).toHaveLength(0);
  });
  
  test("should collect market data", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get data collection capability
    const dataCollector = plugin.getCapabilities().find(
      cap => cap.id === "market-data-collector"
    );
    
    expect(dataCollector).toBeDefined();
    
    // Collect data
    const data = await (dataCollector as any).collectData(
      ["finance", "stocks"],
      { symbols: ["AAPL", "MSFT"] }
    );
    
    // Verify the data structure
    expect(data).toHaveProperty("stocks");
    expect(data).toHaveProperty("collectedAt");
    
    // Verify stock data
    expect(data.stocks).toHaveProperty("AAPL");
    expect(data.stocks).toHaveProperty("MSFT");
    
    expect(data.stocks.AAPL).toHaveProperty("price");
    expect(data.stocks.AAPL).toHaveProperty("change");
    expect(data.stocks.AAPL).toHaveProperty("volume");
  });
  
  test("should enhance prompt with market data", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get prompt enhancement capability
    const promptEnhancer = plugin.getCapabilities().find(
      cap => cap.id === "market-prompt-enhancer"
    );
    
    expect(promptEnhancer).toBeDefined();
    
    // Mock market data
    const marketData = {
      stocks: {
        AAPL: { price: 150.25, change: 2.5, volume: 1000000 },
        MSFT: { price: 300.75, change: -1.2, volume: 2000000 }
      },
      crypto: {
        BTC: { price: 45000.50, change24h: 3.2, marketCap: 850000000000 },
        ETH: { price: 3200.25, change24h: 1.8, marketCap: 380000000000 }
      },
      collectedAt: "2025-03-24T19:30:00Z"
    };
    
    // Enhance prompt
    const originalPrompt = "What do you think about the current market?";
    const enhancedPrompt = await (promptEnhancer as any).enhancePrompt(
      originalPrompt,
      {
        messageId: "test-message-id",
        collectedData: {
          "market-data-collector": marketData
        }
      },
      {}
    );
    
    // Verify that the prompt was enhanced
    expect(enhancedPrompt).toContain(originalPrompt);
    expect(enhancedPrompt).toContain("Market Data Summary");
    expect(enhancedPrompt).toContain("AAPL");
    expect(enhancedPrompt).toContain("MSFT");
    expect(enhancedPrompt).toContain("BTC");
    expect(enhancedPrompt).toContain("ETH");
  });
});

