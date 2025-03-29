import { ExecutionClientService } from "../../services/execution-client";
import { DatabaseService } from "../../services/database";
import { PluginRegistry } from "../../plugins/registry";
import { MessageModel, ExecutionClientStateModel } from "../../models";

// Mock dependencies
jest.mock("../../services/database");
jest.mock("../../plugins/registry");
jest.mock("@solana/web3.js");
jest.mock("@coral-xyz/anchor");
jest.mock("fs");
jest.mock("../../models");

describe("ExecutionClientService", () => {
  let executionClientService: ExecutionClientService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fs.readFileSync
    const fs = require("fs");
    fs.readFileSync.mockReturnValue(JSON.stringify([1, 2, 3, 4]));
    
    // Mock DatabaseService
    const databaseServiceInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnectedToDatabase: jest.fn().mockReturnValue(true),
    };
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(databaseServiceInstance);
    
    // Mock PluginRegistry
    (PluginRegistry.prototype.loadPluginsFromDirectory as jest.Mock).mockResolvedValue(undefined);
    (PluginRegistry.prototype.cleanup as jest.Mock).mockResolvedValue(undefined);
    
    // Create service instance
    executionClientService = new ExecutionClientService();
  });
  
  test("should initialize correctly", async () => {
    // Initialize the service
    await executionClientService.initialize();
    
    // Verify that dependencies were initialized
    expect(DatabaseService.getInstance().connect).toHaveBeenCalled();
    expect(PluginRegistry.prototype.loadPluginsFromDirectory).toHaveBeenCalled();
  });
  
  test("should start and stop polling", async () => {
    // Mock setInterval and clearInterval
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    
    const mockSetInterval = jest.fn().mockReturnValue(123);
    const mockClearInterval = jest.fn();
    
    global.setInterval = mockSetInterval as any;
    global.clearInterval = mockClearInterval;
    
    try {
      // Initialize the service
      await executionClientService.initialize();
      
      // Start polling
      await executionClientService.start();
      
      // Verify that polling was started
      expect(mockSetInterval).toHaveBeenCalled();
      
      // Stop polling
      await executionClientService.stop();
      
      // Verify that polling was stopped
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    } finally {
      // Restore original functions
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    }
  });
  
  test("should clean up resources", async () => {
    // Initialize the service
    await executionClientService.initialize();
    
    // Clean up resources
    await executionClientService.cleanup();
    
    // Verify that dependencies were cleaned up
    expect(PluginRegistry.prototype.cleanup).toHaveBeenCalled();
    expect(DatabaseService.getInstance().disconnect).toHaveBeenCalled();
  });
  
  test("should get execution client state", async () => {
    // Mock ExecutionClientStateModel.findOne
    const mockState = {
      aiNft: "mock-ai-nft",
      totalProcessed: 10,
      totalCompute: 1000,
      totalStaked: 500,
      active: true,
      supportedMessageTypes: ["text"],
      lastUpdated: new Date(),
    };
    
    (ExecutionClientStateModel.findOne as jest.Mock).mockResolvedValue(mockState);
    
    // Initialize the service
    await executionClientService.initialize();
    
    // Get execution client state (private method, need to access it through any)
    const state = await (executionClientService as any).getExecutionClientState();
    
    // Verify the state
    expect(state).toBe(mockState);
    expect(ExecutionClientStateModel.findOne).toHaveBeenCalled();
  });
  
  test("should create execution client state if it doesn't exist", async () => {
    // Mock ExecutionClientStateModel.findOne and create
    (ExecutionClientStateModel.findOne as jest.Mock).mockResolvedValue(null);
    
    const mockCreatedState = {
      aiNft: "mock-ai-nft",
      totalProcessed: 0,
      totalCompute: 0,
      totalStaked: 0,
      active: true,
      supportedMessageTypes: ["text"],
      lastUpdated: new Date(),
    };
    
    (ExecutionClientStateModel.create as jest.Mock).mockResolvedValue(mockCreatedState);
    
    // Initialize the service
    await executionClientService.initialize();
    
    // Get execution client state (private method, need to access it through any)
    const state = await (executionClientService as any).getExecutionClientState();
    
    // Verify the state
    expect(state).toBe(mockCreatedState);
    expect(ExecutionClientStateModel.create).toHaveBeenCalled();
  });
  
  test("should update execution client state", async () => {
    // Mock ExecutionClientStateModel.findOneAndUpdate
    (ExecutionClientStateModel.findOneAndUpdate as jest.Mock).mockResolvedValue({});
    
    // Initialize the service
    await executionClientService.initialize();
    
    // Update execution client state (private method, need to access it through any)
    await (executionClientService as any).updateExecutionClientState();
    
    // Verify that the state was updated
    expect(ExecutionClientStateModel.findOneAndUpdate).toHaveBeenCalled();
    
    // Verify that the update increments totalProcessed
    const updateCall = (ExecutionClientStateModel.findOneAndUpdate as jest.Mock).mock.calls[0];
    expect(updateCall[1].$inc).toHaveProperty("totalProcessed");
    expect(updateCall[1].$inc.totalProcessed).toBe(1);
  });
});
