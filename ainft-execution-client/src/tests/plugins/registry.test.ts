import { PluginRegistry } from "../../plugins/registry";
import { ExecutionClientPlugin, PluginContext, PluginCapability } from "../../plugins/interfaces";

// Mock plugin implementation
class MockPlugin implements ExecutionClientPlugin {
  id = "mock-plugin";
  name = "Mock Plugin";
  version = "1.0.0";
  
  private context: PluginContext | null = null;
  private capabilities: PluginCapability[] = [];
  
  constructor(capabilities: PluginCapability[] = []) {
    this.capabilities = capabilities;
  }
  
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
  }
  
  async cleanup(): Promise<void> {
    this.capabilities = [];
    this.context = null;
  }
  
  getCapabilities(): PluginCapability[] {
    return this.capabilities;
  }
}

// Mock capability implementation
class MockCapability implements PluginCapability {
  id: string;
  name: string;
  type: string;
  
  constructor(id: string, name: string, type: string) {
    this.id = id;
    this.name = name;
    this.type = type;
  }
}

describe("PluginRegistry", () => {
  let pluginRegistry: PluginRegistry;
  let mockLogger: any;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    // Create plugin registry
    pluginRegistry = new PluginRegistry({
      config: {},
      logger: mockLogger
    });
  });
  
  test("should register a plugin", async () => {
    // Create mock capabilities
    const mockCapabilities = [
      new MockCapability("mock-capability-1", "Mock Capability 1", "mock-type-1"),
      new MockCapability("mock-capability-2", "Mock Capability 2", "mock-type-2")
    ];
    
    // Create mock plugin
    const mockPlugin = new MockPlugin(mockCapabilities);
    
    // Register plugin
    await pluginRegistry.registerPlugin(mockPlugin);
    
    // Verify that the plugin was registered
    const plugin = pluginRegistry.getPlugin("mock-plugin");
    
    expect(plugin).toBe(mockPlugin);
    expect(mockLogger.info).toHaveBeenCalled();
  });
  
  test("should get all plugins", async () => {
    // Create mock plugins
    const mockPlugin1 = new MockPlugin();
    const mockPlugin2 = new MockPlugin();
    
    // Override IDs to make them unique
    mockPlugin1.id = "mock-plugin-1";
    mockPlugin2.id = "mock-plugin-2";
    
    // Register plugins
    await pluginRegistry.registerPlugin(mockPlugin1);
    await pluginRegistry.registerPlugin(mockPlugin2);
    
    // Get all plugins
    const plugins = pluginRegistry.getAllPlugins();
    
    expect(plugins).toHaveLength(2);
    expect(plugins).toContain(mockPlugin1);
    expect(plugins).toContain(mockPlugin2);
  });
  
  test("should get a capability by ID", async () => {
    // Create mock capabilities
    const mockCapabilities = [
      new MockCapability("mock-capability-1", "Mock Capability 1", "mock-type-1"),
      new MockCapability("mock-capability-2", "Mock Capability 2", "mock-type-2")
    ];
    
    // Create mock plugin
    const mockPlugin = new MockPlugin(mockCapabilities);
    
    // Register plugin
    await pluginRegistry.registerPlugin(mockPlugin);
    
    // Get capability by ID
    const capability = pluginRegistry.getCapability("mock-capability-1");
    
    expect(capability).toBe(mockCapabilities[0]);
  });
  
  test("should return undefined for non-existent capability", async () => {
    // Get capability by ID
    const capability = pluginRegistry.getCapability("non-existent-capability");
    
    expect(capability).toBeUndefined();
  });
  
  test("should get capabilities by type", async () => {
    // Create mock capabilities
    const mockCapabilities = [
      new MockCapability("mock-capability-1", "Mock Capability 1", "mock-type-1"),
      new MockCapability("mock-capability-2", "Mock Capability 2", "mock-type-2"),
      new MockCapability("mock-capability-3", "Mock Capability 3", "mock-type-1")
    ];
    
    // Create mock plugin
    const mockPlugin = new MockPlugin(mockCapabilities);
    
    // Register plugin
    await pluginRegistry.registerPlugin(mockPlugin);
    
    // Get capabilities by type
    const capabilities = pluginRegistry.getCapabilitiesByType("mock-type-1");
    
    expect(capabilities).toHaveLength(2);
    expect(capabilities).toContain(mockCapabilities[0]);
    expect(capabilities).toContain(mockCapabilities[2]);
  });
  
  test("should clean up all plugins", async () => {
    // Create mock plugins
    const mockPlugin1 = new MockPlugin();
    const mockPlugin2 = new MockPlugin();
    
    // Override IDs to make them unique
    mockPlugin1.id = "mock-plugin-1";
    mockPlugin2.id = "mock-plugin-2";
    
    // Spy on cleanup methods
    const cleanup1 = jest.spyOn(mockPlugin1, "cleanup");
    const cleanup2 = jest.spyOn(mockPlugin2, "cleanup");
    
    // Register plugins
    await pluginRegistry.registerPlugin(mockPlugin1);
    await pluginRegistry.registerPlugin(mockPlugin2);
    
    // Clean up all plugins
    await pluginRegistry.cleanup();
    
    // Verify that cleanup methods were called
    expect(cleanup1).toHaveBeenCalled();
    expect(cleanup2).toHaveBeenCalled();
    
    // Verify that plugins were removed
    expect(pluginRegistry.getAllPlugins()).toHaveLength(0);
  });
});
