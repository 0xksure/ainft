# AI NFT Protocol SDK

This SDK provides scripts for initializing and managing the AI NFT Protocol on Solana.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
```
PAYER_PRIVATE_KEY=your_base58_encoded_private_key
PROGRAM_ID=14M8GDtWobqndjTrJ4sDZJ2CY74TXyGWGJzJoAE4TNYh
NETWORK=devnet # devnet, testnet, or mainnet-beta
```

## Available Scripts

### Create AI NFT App
Initializes the AI NFT application and creates necessary PDAs:

```bash
pnpm create-app
```

### Create Compute Mint
Creates the compute token mint for the AI NFT application:

```bash
pnpm create-compute-mint
```

### Mint Compute Tokens
Mints compute tokens to the authority's account:

```bash
pnpm mint-compute <amount>
```

Example:
```bash
pnpm mint-compute 1000
```

## Development

The SDK is written in TypeScript and uses the following technologies:
- @project-serum/anchor for Solana program interactions
- @solana/web3.js for Solana blockchain interactions
- ts-node for running TypeScript scripts directly

## Directory Structure

```
sdk-ts/
├── src/
│   ├── scripts/           # Command-line scripts
│   │   ├── create-app-ainft.ts
│   │   ├── create-compute-mint.ts
│   │   └── mint-compute.ts
│   └── utils.ts          # Shared utilities and helpers
├── .env.example          # Example environment configuration
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
``` 