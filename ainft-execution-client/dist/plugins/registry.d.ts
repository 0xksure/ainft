import { ExecutionClientPlugin, PluginCapability, PluginContext } from './interfaces';
/**
 * Registry for managing execution client plugins
 */
export declare class PluginRegistry {
    private plugins;
    private capabilities;
    private context;
    constructor(context: PluginContext);
    /**
     * Load plugins from a directory
     * @param directory Directory containing plugin files
     */
    loadPluginsFromDirectory(directory: string): Promise<void>;
    /**
     * Register a plugin
     * @param plugin Plugin to register
     */
    registerPlugin(plugin: ExecutionClientPlugin): Promise<void>;
    /**
     * Get a plugin by ID
     * @param pluginId Plugin ID
     */
    getPlugin(pluginId: string): ExecutionClientPlugin | undefined;
    /**
     * Get all registered plugins
     */
    getAllPlugins(): ExecutionClientPlugin[];
    /**
     * Get a capability by ID
     * @param capabilityId Capability ID
     */
    getCapability(capabilityId: string): PluginCapability | undefined;
    /**
     * Get capabilities by type
     * @param type Capability type
     */
    getCapabilitiesByType(type: string): PluginCapability[];
    /**
     * Clean up all plugins
     */
    cleanup(): Promise<void>;
}
