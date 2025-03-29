
run: deploy-local local-airdrop init run-app

run-app:
    cd app && pnpm run dev

# Build and deploy the program
deploy-local:
    anchor build
    solana airdrop 100 --url http://127.0.0.1:8899 $(solana-keygen pubkey ${WALLET_LOCATION_PATH}) 
    anchor deploy --program-name ainft --provider.cluster localnet --program-keypair ./target/deploy/ainft-keypair.json

start-local:
    solana-test-validator -r --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s ./tests/metaplex_token_metadata_program.so
# Initialize the program by running the setup scripts
init: 
    cd sdk-ts && source .env.example && pnpm run create-app && pnpm run create-compute-mint && pnpm run mint-compute 10000000000 ${WALLET_ADDRESS} 

mint-compute:
    cd sdk-ts && source .env.example && pnpm run mint-compute 10000000000 ${WALLET_ADDRESS} 

# Build the program
build:
    anchor build

# Combined command to start validator, deploy and initialize
start: deploy-local init

local-airdrop:
    solana airdrop -u http://127.0.0.1:8899 10 ${WALLET_ADDRESS} 
    solana airdrop -u http://127.0.0.1:8899 10 $(solana address -k ~/.config/solana/id_latest.json)

deploy ENV: 
    anchor deploy --program-name ainft --provider.cluster {{ENV}} --program-keypair ./target/deploy/ainft-keypair.json --provider.wallet ~/.config/solana/id_latest.json

dotenv:
    set -a && source .env && set +a