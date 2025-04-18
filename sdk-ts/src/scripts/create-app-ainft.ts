import { Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { getProgram, findAppAinftPDA } from '../utils';
import { Logger } from '../utils/logger';
import { BN } from '@coral-xyz/anchor';

async function main() {
    Logger.info('Starting AI NFT App initialization...');

    try {
        // Check environment
        if (!process.env.PAYER_KEYPAIR_PATH) {
            Logger.error('Missing PAYER_KEYPAIR_PATH in environment');
            Logger.printInstructions('Please add your keypair path to the .env file:\nPAYER_KEYPAIR_PATH=/path/to/your/keypair.json');
            process.exit(1);
        }

        // Load keypair from file
        const payerKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(require('fs').readFileSync(process.env.PAYER_KEYPAIR_PATH, 'utf-8')))
        );

        // Setup program and payer
        const payer = payerKeypair;
        const program = await getProgram();

        Logger.info(`Using payer: ${payer.publicKey.toBase58()}`);

        // Check payer balance
        const balance = await program.provider.connection.getBalance(payer.publicKey);
        if (balance < 0.1 * LAMPORTS_PER_SOL) {
            Logger.warn(`Low balance: ${balance / LAMPORTS_PER_SOL} SOL. Consider airdropping more.`);
        }

        // Create a default execution client pubkey
        Logger.startSpinner('Generating default execution client...');
        const defaultExecutionClient = Keypair.generate().publicKey;
        Logger.spinnerSuccess(`Default execution client: ${defaultExecutionClient.toBase58()}`);

        // Derive app ainft PDA
        Logger.startSpinner('Deriving program addresses...');
        const [appAinftPda] = findAppAinftPDA();
        Logger.spinnerSuccess(`App PDA: ${appAinftPda.toBase58()}`);

        // Prepare parameters for app initialization
        const createAiNftParams = {
            name: "AI Agent Collection",
            uri: "https://example.com/metadata.json",
            symbol: "AIA",
            defaultExecutionClient: defaultExecutionClient,
            mintPrice: new BN(100),
            maxSupply: new BN(100),
            computeMint: PublicKey.default, // Set to default for external mint
        };

        // Create the AINFT App
        Logger.startSpinner('Creating AI NFT App...');
        const tx = await program.methods
            .createAppAinft(createAiNftParams)
            .accounts({
                payer: payer.publicKey,
            })
            .signers([payer])
            .rpc();

        Logger.spinnerSuccess(`AI NFT App created successfully!`);
        Logger.info(`Transaction: ${tx}`);

        // Verify the AINFT app was created correctly
        const ainftAccount = await program.account.aiNft.fetch(appAinftPda);
        Logger.info('AINFT App Details:');
        Logger.info(`- Authority: ${ainftAccount.authority.toBase58()}`);
        Logger.info(`- Compute Mint: ${ainftAccount.computeMint.toBase58() === PublicKey.default.toBase58() ? 'Not set' : ainftAccount.computeMint.toBase58()}`);

        Logger.info('\nNext steps:');
        Logger.info('1. Create an external compute mint');
        Logger.info('2. Set the external compute mint using `set-external-compute-mint` command');
        Logger.info('3. Register an execution client for your AINFT');
        Logger.info('4. Create a collection and premint NFTs');

    } catch (error: any) {
        Logger.spinnerError('Failed to create AI NFT App');

        if (error.message?.includes('Account already exists')) {
            Logger.error('App already initialized for this authority');
        } else {
            Logger.error(error.message || 'Unknown error occurred');
            console.log(error);
        }

        process.exit(1);
    }
}

main(); 