# ainFT Execution Client

A flexible, extensible execution client for the ainFT platform that processes messages sent to AI NFTs on the Solana blockchain.

## Features

- **Plugin Architecture**: Easily extend the execution client with new capabilities without modifying the core codebase
- **Data Collection**: Collect specialized data from various sources to enhance AI responses
- **Prompt Enhancement**: Intelligently enhance prompts with domain-specific knowledge
- **Response Processing**: Process AI responses before sending them back to the blockchain
- **Blockchain Interaction**: Execute cross-program invocations and deploy smart contracts
- **Robust Data Storage**: Store and retrieve specialized data using MongoDB
- **Comprehensive Testing**: Extensive test suite ensures reliability

## Architecture

The execution client follows a plugin-based architecture that allows for easy extension with new capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    Execution Client Core                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Message     │  │ Blockchain  │  │ Plugin Registry     │  │
│  │ Processing  │  │ Interaction │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Interface                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Data        │  │ Prompt      │  │ Response            │  │
│  │ Collection  │  │ Enhancement │  │ Processing          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Specialized Plugins                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Market      │  │ Smart       │  │ Other               │  │
│  │ Analysis    │  │ Contract    │  │ Specialized         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB
- Solana CLI (for blockchain interaction)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ainft-execution-client.git
   cd ainft-execution-client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration values.

### Building the Project

```bash
npm run build
```

### Running the Execution Client

```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

### Running Tests

```bash
npm test
```

For test coverage:
```bash
npm run test:coverage
```

## Plugin Development

The execution client can be extended with plugins that provide specialized capabilities. To create a new plugin:

1. Create a new TypeScript file in the `plugins` directory
2. Implement the `ExecutionClientPlugin` interface
3. Implement one or more capability interfaces:
   - `DataCollectionCapability`
   - `PromptEnhancementCapability`
   - `ResponseProcessingCapability`
   - `BlockchainInteractionCapability`

Example plugin structure:

```typescript
import { 
  ExecutionClientPlugin, 
  PluginContext, 
  PluginCapability,
  DataCollectionCapability
} from "../interfaces";

// Implement capability
class MyDataCollectionCapability implements DataCollectionCapability {
  id = "my-data-collector";
  name = "My Data Collector";
  type = "data-collector";
  supportedSources = ["my-source"];
  
  async collectData(sources: string[], parameters: Record<string, any>): Promise<any> {
    // Implementation
  }
}

// Implement plugin
export default class MyPlugin implements ExecutionClientPlugin {
  id = "my-plugin";
  name = "My Plugin";
  version = "1.0.0";
  
  private context: PluginContext | null = null;
  private capabilities: PluginCapability[] = [];
  
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.capabilities = [new MyDataCollectionCapability()];
  }
  
  async cleanup(): Promise<void> {
    this.capabilities = [];
    this.context = null;
  }
  
  getCapabilities(): PluginCapability[] {
    return this.capabilities;
  }
}
```

## Configuration

The execution client can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | Solana RPC URL | https://api.devnet.solana.com |
| `PROGRAM_ID` | ainFT program ID | - |
| `KEYPAIR_PATH` | Path to keypair file | ./keypair.json |
| `LLM_PROVIDER` | LLM provider (e.g., openai) | openai |
| `LLM_API_KEY` | API key for LLM provider | - |
| `LLM_MODEL` | Model to use for LLM | gpt-4 |
| `POLLING_INTERVAL` | Interval for polling new messages (ms) | 1000 |
| `MAX_RETRIES` | Maximum retries for failed operations | 3 |
| `RETRY_DELAY` | Delay between retries (ms) | 2000 |
| `MONGODB_URI` | MongoDB connection URI | mongodb://localhost:27017/ainft-execution-client |
| `LOG_LEVEL` | Logging level | info |

## License

This project is licensed under the ISC License.
