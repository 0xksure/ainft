
run: deploy-local local-airdrop init run-app

run-app:
    cd app && pnpm run dev

# Build and deploy the program
deploy-local:
    anchor build
    solana airdrop 100 --url http://127.0.0.1:8899 $(solana-keygen pubkey ~/.config/solana/id_latest.json) 
    anchor deploy --program-name ainft --provider.cluster localnet --program-keypair ./target/deploy/ainft-keypair.json

start-local:
    solana-test-validator -r --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s ./tests/metaplex_token_metadata_program.so
# Initialize the program by running the setup scripts
init: 
    cd sdk-ts && source .env.example && pnpm run create-app && pnpm run create-compute-mint && pnpm run mint-compute 10000000000 8kyCmyjja5BG81reTM4E8mN2KsLHzmxg9us28RFvH1hf

# Build the program
build:
    anchor build

# Start local validator with necessary programs
validator:
    solana-test-validator \
        --reset \
        --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s target/deploy/metaplex_token_metadata_program.so \
        --bpf-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA target/deploy/spl_token.so

# Combined command to start validator, deploy and initialize
start: validator deploy-local init

local-airdrop:
    solana airdrop -u http://127.0.0.1:8899 10 8kyCmyjja5BG81reTM4E8mN2KsLHzmxg9us28RFvH1hf
    solana airdrop -u http://127.0.0.1:8899 10 $(solana address -k ~/.config/solana/id_latest.json)