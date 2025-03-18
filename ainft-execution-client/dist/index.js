"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execution_client_1 = require("./services/execution-client");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Create and start execution client
const executionClient = new execution_client_1.ExecutionClientService();
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    await executionClient.cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    await executionClient.cleanup();
    process.exit(0);
});
// Initialize and start execution client
async function main() {
    try {
        // Initialize execution client
        await executionClient.initialize();
        // Start execution client
        await executionClient.start();
        console.log('Execution client is running');
    }
    catch (error) {
        console.error('Failed to start execution client:', error);
        await executionClient.cleanup();
        process.exit(1);
    }
}
// Run main function
main();
