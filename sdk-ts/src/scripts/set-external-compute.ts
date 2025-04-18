import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { getProgram, findAppAinftPDA } from '../utils';
import { Logger } from '../utils/logger';
import * as anchor from '@coral-xyz/anchor';

async function main() {
    Logger.info('Setting external compute mint...');

    try {
        // Check environment
        if (!process.env.PAYER_KEYPAIR_PATH) {
            Logger.error('Missing PAYER_KEYPAIR_PATH in environment');
            process.exit(1);
        }

        if (!process.env.RPC_URL) {
            Logger.error('Missing RPC_URL in environment');
            process.exit(1);
        }

        if (!process.env.COMPUTE_MINT_ADDRESS) {
            Logger.error('Missing COMPUTE_MINT_ADDRESS in environment');
            process.exit(1);
        }

        // Initialize connection
        const connection = new Connection(process.env.RPC_URL, "confirmed");

        // Load keypair
        const signerKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(require('fs').readFileSync(process.env.PAYER_KEYPAIR_PATH, 'utf-8')))
        );

        // Get compute mint address
        const computeMintAddress = new PublicKey(process.env.COMPUTE_MINT_ADDRESS);

        // Set compute mint in AI NFT program
        Logger.startSpinner('Setting external compute mint...');
        console.log("Setting external compute mint:", computeMintAddress.toString());

        const [appAinftPda] = findAppAinftPDA();
        const program = await getProgram();

        await program.methods
            .setExternalComputeMint()
            .accounts({
                externalComputeMint: computeMintAddress,
            })
            .signers([signerKeypair])
            .rpc();

        Logger.spinnerSuccess('Compute mint configured');

    } catch (error: any) {
        Logger.spinnerError('Failed to set external compute mint. Cause: ' + error.message);
        process.exit(1);
    }
}

main();
