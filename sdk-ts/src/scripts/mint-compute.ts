import { getProgram, getPayer, findMasterMintPDA, findAppAinftPDA, findComputeMintPDA } from '../utils';
import { BN } from '@coral-xyz/anchor';
import { Logger } from '../utils/logger';
import { Keypair, PublicKey } from '@solana/web3.js';
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token';

async function main() {
    Logger.info('Starting Compute Token minting...');

    // Get amount from command line arguments
    const amount = process.argv[2];
    if (!amount || isNaN(Number(amount))) {
        Logger.error('Invalid amount provided');
        Logger.printInstructions('Usage: pnpm mint-compute <amount>\nExample: pnpm mint-compute 1000');
        process.exit(1);
    }

    const address = process.argv[3];
    if (!address) {
        Logger.error('Invalid address provided');
        Logger.printInstructions('Usage: pnpm mint-compute <amount> <address>\nExample: pnpm mint-compute 1000 0x1234567890');
        process.exit(1);
    }

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
        const recipientTokenAccount = await associatedAddress({ mint: computeMint, owner: new PublicKey(address) });
        Logger.spinnerSuccess('Program addresses derived');

        Logger.printPDA('Master Mint', masterMint.toBase58());
        Logger.printPDA('App PDA', appAinftPda.toBase58());
        Logger.printPDA('Compute Mint', computeMint.toBase58());
        Logger.printPDA('Recipient Token Account', recipientTokenAccount.toBase58());
        Logger.printPDA('Destination User', new PublicKey(address).toBase58());

        Logger.startSpinner(`Minting ${amount} compute tokens...`);
        await program.methods
            .mintCompute(new BN(amount))
            .accounts({
                // @ts-ignore
                aiNft: appAinftPda,
                computeMint,
                recipientTokenAccount: recipientTokenAccount,
                destinationUser: new PublicKey(address),
                authority: payer.publicKey,
            })
            .signers([payer])
            .rpc();

        /// get new token balance
        const balance = await program.provider.connection.getTokenAccountBalance(recipientTokenAccount);
        Logger.info(`New token balance: ${balance.value.amount}`);

        Logger.spinnerSuccess('Successfully minted compute tokens!');
        Logger.info(`Amount minted: ${amount} tokens`);
        Logger.info('\nNext steps:');
        Logger.info('1. Use the compute tokens to power your AI NFTs');
        Logger.info('2. Stake compute tokens with execution clients');
    } catch (error: any) {
        Logger.spinnerError('Failed to mint compute tokens');

        if (error.message?.includes('Account not found')) {
            Logger.error('Compute Mint not found. Please run these commands in order:');
            Logger.info('1. pnpm create-app');
            Logger.info('2. pnpm create-compute-mint');
        } else if (error.message?.includes('insufficient funds')) {
            Logger.error('Insufficient SOL balance for transaction');
            Logger.printInstructions('Please fund your wallet with SOL and try again');
        } else {
            Logger.error(error.message || 'Unknown error occurred');
        }

        process.exit(1);
    }
}

main(); 