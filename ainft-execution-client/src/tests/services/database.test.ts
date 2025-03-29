import { DatabaseService } from "../../services/database";
import mongoose from "mongoose";

// Mock mongoose
jest.mock("mongoose");

describe("DatabaseService", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset singleton instance
    // @ts-ignore: Accessing private property for testing
    DatabaseService.instance = undefined;
  });
  
  test("should be a singleton", () => {
    // Get two instances
    const instance1 = DatabaseService.getInstance();
    const instance2 = DatabaseService.getInstance();
    
    // Verify that they are the same instance
    expect(instance1).toBe(instance2);
  });
  
  test("should connect to MongoDB", async () => {
    // Mock mongoose.connect
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    
    // Get instance
    const instance = DatabaseService.getInstance();
    
    // Connect to database
    await instance.connect();
    
    // Verify that mongoose.connect was called
    expect(mongoose.connect).toHaveBeenCalled();
    
    // Verify that isConnected is true
    expect(instance.isConnectedToDatabase()).toBe(true);
  });
  
  test("should not connect if already connected", async () => {
    // Mock mongoose.connect
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    
    // Get instance
    const instance = DatabaseService.getInstance();
    
    // Connect to database
    await instance.connect();
    
    // Reset mock
    (mongoose.connect as jest.Mock).mockClear();
    
    // Connect again
    await instance.connect();
    
    // Verify that mongoose.connect was not called again
    expect(mongoose.connect).not.toHaveBeenCalled();
  });
  
  test("should disconnect from MongoDB", async () => {
    // Mock mongoose.connect and disconnect
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    (mongoose.disconnect as jest.Mock).mockResolvedValue(undefined);
    
    // Get instance
    const instance = DatabaseService.getInstance();
    
    // Connect to database
    await instance.connect();
    
    // Disconnect from database
    await instance.disconnect();
    
    // Verify that mongoose.disconnect was called
    expect(mongoose.disconnect).toHaveBeenCalled();
    
    // Verify that isConnected is false
    expect(instance.isConnectedToDatabase()).toBe(false);
  });
  
  test("should not disconnect if not connected", async () => {
    // Mock mongoose.disconnect
    (mongoose.disconnect as jest.Mock).mockResolvedValue(undefined);
    
    // Get instance
    const instance = DatabaseService.getInstance();
    
    // Disconnect from database
    await instance.disconnect();
    
    // Verify that mongoose.disconnect was not called
    expect(mongoose.disconnect).not.toHaveBeenCalled();
  });
  
  test("should handle connection errors", async () => {
    // Mock mongoose.connect to throw an error
    const error = new Error("Connection error");
    (mongoose.connect as jest.Mock).mockRejectedValue(error);
    
    // Get instance
    const instance = DatabaseService.getInstance();
    
    // Connect to database
    await expect(instance.connect()).rejects.toThrow(error);
    
    // Verify that isConnected is false
    expect(instance.isConnectedToDatabase()).toBe(false);
  });
  
  test("should handle disconnection errors", async () => {
    // Mock mongoose.connect and disconnect
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    
    const error = new Error("Disconnection error");
    (mongoose.disconnect as jest.Mock).mockRejectedValue(error);
    
    // Get instance
    const instance = DatabaseService.getInstance();
    
    // Connect to database
    await instance.connect();
    
    // Disconnect from database
    await expect(instance.disconnect()).rejects.toThrow(error);
    
    // Verify that isConnected is still true
    expect(instance.isConnectedToDatabase()).toBe(true);
  });
});
