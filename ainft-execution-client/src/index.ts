import { ExecutionClientService } from './services/execution-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up environment-specific logging
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevEnvironment = NODE_ENV === 'development' || NODE_ENV === 'dev';

// Configure debug logging
if (isDevEnvironment) {
  console.log('Running in development mode - verbose logging enabled');
  // Override console.log with more detailed logging in dev mode
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  console.log = (...args) => {
    const timestamp = new Date().toISOString();
    originalConsoleLog(`[${timestamp}][DEBUG]`, ...args);
  };
  
  console.error = (...args) => {
    const timestamp = new Date().toISOString();
    const stack = new Error().stack?.split('\n').slice(2).join('\n');
    originalConsoleError(`[${timestamp}][ERROR]`, ...args);
    originalConsoleError(`[${timestamp}][STACK] ${stack}`);
  };
  
  console.debug = (...args) => {
    const timestamp = new Date().toISOString();
    originalConsoleLog(`[${timestamp}][VERBOSE]`, ...args);
  };
}

// Create and start execution client
const executionClient = new ExecutionClientService();

if (isDevEnvironment) {
  console.log('Execution client configuration:');
  console.log('- RPC URL:', process.env.RPC_URL);
  console.log('- Program ID:', process.env.PROGRAM_ID);
  console.log('- Keypair Path:', process.env.KEYPAIR_PATH);
  console.log('- MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/(.+?):(.+?)@/, '//***:***@'));
  console.log('- Plugins Directory:', process.env.PLUGINS_DIR);
}

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
    if (isDevEnvironment) {
      console.log('Starting execution client initialization...');
    }
    
    // Initialize execution client
    await executionClient.initialize();
    
    if (isDevEnvironment) {
      console.log('Execution client initialized successfully, starting services...');
    }
    
    // Start execution client
    await executionClient.start();
    
    console.log('Execution client is running');
  } catch (error) {
    console.error('Failed to start execution client:', error);
    await executionClient.cleanup();
    process.exit(1);
  }
}

// Run main function
main();
