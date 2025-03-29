import { ExecutionClientPlugin, PluginContext, PluginCapability } from "../interfaces";
export default class MarketAnalysisPlugin implements ExecutionClientPlugin {
    id: string;
    name: string;
    version: string;
    private context;
    private capabilities;
    initialize(context: PluginContext): Promise<void>;
    cleanup(): Promise<void>;
    getCapabilities(): PluginCapability[];
}
