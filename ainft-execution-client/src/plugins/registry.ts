import fs from 'fs';
import path from 'path';
import { ExecutionClientPlugin, PluginCapability, PluginContext } from './interfaces';

/**
 * Registry for managing execution client plugins
 */
export class PluginRegistry {
  private plugins: Map<string, ExecutionClientPlugin> = new Map();
  private capabilities: Map<string, PluginCapability> = new Map();
  private context: PluginContext;
  
  constructor(context: PluginContext) {
    this.context = context;
  }
  
  /**
   * Load plugins from a directory
   * @param directory Directory containing plugin files
   */
  async loadPluginsFromDirectory(directory: string): Promise<void> {
    try {
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        // Skip non-JavaScript/TypeScript files
        if (!file.endsWith('.js') && !file.endsWith('.ts')) {
          continue;
        }
        
        try {
          const pluginPath = path.join(directory, file);
          const PluginClass = require(pluginPath).default;
          
          // Skip files that don't export a plugin
          if (!PluginClass || typeof PluginClass !== 'function') {
            continue;
          }
          
          // Create plugin instance
          const plugin = new PluginClass();
          
          // Register plugin
          await this.registerPlugin(plugin);
        } catch (error) {
          this.context.logger.error(`Failed to load plugin from file ${file}:`, error);
        }
      }
    } catch (error) {
      this.context.logger.error(`Failed to load plugins from directory ${directory}:`, error);
      throw error;
    }
  }
  
  /**
   * Register a plugin
   * @param plugin Plugin to register
   */
  async registerPlugin(plugin: ExecutionClientPlugin): Promise<void> {
    try {
      // Initialize plugin
      await plugin.initialize(this.context);
      
      // Register plugin
      this.plugins.set(plugin.id, plugin);
      
      // Register capabilities
      for (const capability of plugin.getCapabilities()) {
        this.capabilities.set(capability.id, capability);
      }
      
      this.context.logger.info(`Registered plugin: ${plugin.name} (${plugin.id})`);
    } catch (error) {
      this.context.logger.error(`Failed to register plugin ${plugin.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a plugin by ID
   * @param pluginId Plugin ID
   */
  getPlugin(pluginId: string): ExecutionClientPlugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): ExecutionClientPlugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get a capability by ID
   * @param capabilityId Capability ID
   */
  getCapability(capabilityId: string): PluginCapability | undefined {
    return this.capabilities.get(capabilityId);
  }
  
  /**
   * Get capabilities by type
   * @param type Capability type
   */
  getCapabilitiesByType(type: string): PluginCapability[] {
    return Array.from(this.capabilities.values())
      .filter(capability => capability.type === type);
  }
  
  /**
   * Clean up all plugins
   */
  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.cleanup();
      } catch (error) {
        this.context.logger.error(`Failed to clean up plugin ${plugin.name}:`, error);
      }
    }
    
    this.plugins.clear();
    this.capabilities.clear();
  }
}
