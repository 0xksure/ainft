import SmartContractPlugin from "../../../plugins/examples/smart-contract-plugin";
import { PluginContext } from "../../../plugins/interfaces";

describe("SmartContractPlugin", () => {
  let plugin: SmartContractPlugin;
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
      config: {},
      logger: mockLogger
    };
    
    // Create plugin instance
    plugin = new SmartContractPlugin();
  });
  
  test("should initialize correctly", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Verify that the plugin has capabilities
    const capabilities = plugin.getCapabilities();
    
    expect(capabilities).toHaveLength(3);
    
    // Verify that the plugin has the expected capabilities
    const promptEnhancer = capabilities.find(cap => cap.id === "smart-contract-prompt-enhancer");
    const responseProcessor = capabilities.find(cap => cap.id === "smart-contract-response-processor");
    const blockchainInteraction = capabilities.find(cap => cap.id === "smart-contract-blockchain-interaction");
    
    expect(promptEnhancer).toBeDefined();
    expect(responseProcessor).toBeDefined();
    expect(blockchainInteraction).toBeDefined();
    
    expect(promptEnhancer?.type).toBe("prompt-enhancer");
    expect(responseProcessor?.type).toBe("response-processor");
    expect(blockchainInteraction?.type).toBe("blockchain-interaction");
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
  
  test("should enhance prompt for smart contract requests", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get prompt enhancement capability
    const promptEnhancer = plugin.getCapabilities().find(
      cap => cap.id === "smart-contract-prompt-enhancer"
    );
    
    expect(promptEnhancer).toBeDefined();
    
    // Enhance prompt for a smart contract request
    const originalPrompt = "Can you create a smart contract for an NFT marketplace?";
    const enhancedPrompt = await (promptEnhancer as any).enhancePrompt(
      originalPrompt,
      { messageId: "test-message-id" },
      {}
    );
    
    // Verify that the prompt was enhanced
    expect(enhancedPrompt).toContain(originalPrompt);
    expect(enhancedPrompt).toContain("Anchor framework");
    expect(enhancedPrompt).toContain("Solana security best practices");
  });
  
  test("should not enhance prompt for non-smart contract requests", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get prompt enhancement capability
    const promptEnhancer = plugin.getCapabilities().find(
      cap => cap.id === "smart-contract-prompt-enhancer"
    );
    
    expect(promptEnhancer).toBeDefined();
    
    // Enhance prompt for a non-smart contract request
    const originalPrompt = "What is the weather like today?";
    const enhancedPrompt = await (promptEnhancer as any).enhancePrompt(
      originalPrompt,
      { messageId: "test-message-id" },
      {}
    );
    
    // Verify that the prompt was not enhanced
    expect(enhancedPrompt).toBe(originalPrompt);
  });
  
  test("should process response with Rust code", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get response processing capability
    const responseProcessor = plugin.getCapabilities().find(
      cap => cap.id === "smart-contract-response-processor"
    );
    
    expect(responseProcessor).toBeDefined();
    
    // Process response with Rust code
    const originalResponse = "Here is a smart contract for an NFT marketplace:\n\n```rust\nuse anchor_lang::prelude::*;\n\n#[program]\nmod nft_marketplace {\n    use super::*;\n    \n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}\n```";
    
    const processedResponse = await (responseProcessor as any).processResponse(
      originalResponse,
      { messageId: "test-message-id" }
    );
    
    // Verify that the response was processed
    expect(processedResponse).toContain(originalResponse);
    expect(processedResponse).toContain("Smart Contract Validation Results");
    expect(processedResponse).toContain("valid");
  });
  
  test("should not process response without Rust code", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get response processing capability
    const responseProcessor = plugin.getCapabilities().find(
      cap => cap.id === "smart-contract-response-processor"
    );
    
    expect(responseProcessor).toBeDefined();
    
    // Process response without Rust code
    const originalResponse = "I don't think a smart contract is needed for this use case.";
    
    const processedResponse = await (responseProcessor as any).processResponse(
      originalResponse,
      { messageId: "test-message-id" }
    );
    
    // Verify that the response was not processed
    expect(processedResponse).toBe(originalResponse);
  });
  
  test("should execute CPI", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get blockchain interaction capability
    const blockchainInteraction = plugin.getCapabilities().find(
      cap => cap.id === "smart-contract-blockchain-interaction"
    );
    
    expect(blockchainInteraction).toBeDefined();
    
    // Execute CPI
    const result = await (blockchainInteraction as any).executeCPI(
      "spl-token",
      "transfer",
      [{ pubkey: "mock-pubkey", isSigner: false, isWritable: true }],
      { amount: 100 }
    );
    
    // Verify the result
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("transactionId");
    expect(result).toHaveProperty("timestamp");
    expect(result.success).toBe(true);
  });
  
  test("should deploy smart contract", async () => {
    // Initialize the plugin
    await plugin.initialize(mockContext);
    
    // Get blockchain interaction capability
    const blockchainInteraction = plugin.getCapabilities().find(
      cap => cap.id === "smart-contract-blockchain-interaction"
    );
    
    expect(blockchainInteraction).toBeDefined();
    
    // Deploy smart contract
    const contractCode = "use anchor_lang::prelude::*;\n\n#[program]\nmod nft_marketplace {\n    use super::*;\n    \n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}";
    
    const result = await (blockchainInteraction as any).deploySmartContract(
      contractCode,
      { network: "devnet" }
    );
    
    // Verify the result
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("programId");
    expect(result).toHaveProperty("deploymentTimestamp");
    expect(result.success).toBe(true);
  });
});
