import { Keypair } from '@solana/web3.js';
import { getProgram, getPayer, findMasterMintPDA, findAppAinftPDA, findComputeMintPDA, findComputeMetadataPDA } from '../utils';
import { Logger } from '../utils/logger';

async function main() {
    Logger.info('Starting Compute Mint creation...');

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

        const payer = payerKeypair;
        const program = await getProgram();

        Logger.startSpinner('Deriving program addresses...');
        const [masterMint] = findMasterMintPDA();
        const [appAinftPda] = findAppAinftPDA();
        const [computeMint] = findComputeMintPDA();
        const [computeMintMetadata] = findComputeMetadataPDA(computeMint);
        Logger.spinnerSuccess('Program addresses derived');

        Logger.printPDA('Master Mint', masterMint.toBase58());
        Logger.printPDA('App PDA', appAinftPda.toBase58());
        Logger.printPDA('Compute Mint', computeMint.toBase58());

        Logger.startSpinner('Creating Compute Mint...');
        await program.methods
            .createComputeMint()
            .accounts({
                // @ts-ignore
                aiNft: appAinftPda,
                computeMint,
                computeMintMetadata: computeMintMetadata,
                payer: payer.publicKey,
            })
            .signers([payer])
            .rpc();

        Logger.spinnerSuccess('Successfully created Compute Mint!');
        Logger.info('\nNext step:');
        Logger.info('Mint compute tokens: pnpm mint-compute <amount>');
    } catch (error: any) {
        Logger.spinnerError('Failed to create Compute Mint');

        if (error.message?.includes('Account already exists')) {
            Logger.error('Compute Mint already exists for this app');
        } else if (error.message?.includes('Account not found')) {
            Logger.error('App not initialized. Please run pnpm create-app first');
        } else {
            Logger.error(error.message || 'Unknown error occurred');
        }

        process.exit(1);
    }
}

main(); 