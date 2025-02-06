import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getProgram, findMasterMintPDA, findAppAinftPDA, findMetadataPDA } from '../utils';
import { Logger } from '../utils/logger';
import { BN } from '@coral-xyz/anchor';
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { publicKey } from '@coral-xyz/anchor/dist/cjs/utils';

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

        const payer = payerKeypair;
        if (!payer) {
            Logger.error('Failed to load keypair');
            process.exit(1);
        }
        console.log("hello");
        console.log(payer.publicKey.toBase58());
        const program = await getProgram();

        Logger.startSpinner('Deriving program addresses...');
        const [appAinftPda] = findAppAinftPDA();
        const [masterMint] = findMasterMintPDA();
        // get master_metadata account 
        const [masterMetadata] = findMetadataPDA(masterMint);
        // get token account for payer
        const tokenAccount = await associatedAddress({ mint: masterMint, owner: payer.publicKey });
        Logger.spinnerSuccess('Program addresses derived');

        Logger.printPDA('Master Mint', masterMint.toBase58());
        Logger.printPDA('App PDA', appAinftPda.toBase58());

        Logger.startSpinner('Creating AI NFT App...');
        const ix = await program.methods
            .createAppAinft({
                name: 'AI NFT App',
                uri: 'https://ai-nft-app.com',
                symbol: 'AINFT',
                defaultExecutionClient: PublicKey.default,
                mintPrice: new BN(1),
                maxSupply: new BN(10),
            })
            .accounts({
                // @ts-ignore
                aiNft: appAinftPda,
                masterMint,
                masterToken: tokenAccount,
                masterMetadata: masterMetadata,
                payer: payer.publicKey,
            })
            .signers([payer])
            .instruction();

        const tx = new Transaction().add(ix);
        const txHash = await sendAndConfirmTransaction(program.provider.connection, tx, [payer]);
        console.log(txHash);
        Logger.spinnerSuccess('Successfully created AI NFT App!');
        Logger.info('\nNext steps:');
        Logger.info('1. Create the compute mint: pnpm create-compute-mint');
        Logger.info('2. Mint compute tokens: pnpm mint-compute <amount>');
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