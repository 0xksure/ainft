import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { Logger } from '../utils/logger';
import * as anchor from '@coral-xyz/anchor';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { createSignerFromKeypair, generateSigner, percentAmount, publicKey, signerIdentity, signerPayer } from '@metaplex-foundation/umi';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { createV1, mintV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { createAssociatedTokenAccount, createMint, mintTo } from '@solana/spl-token';

async function main() {
    Logger.info('Creating SPL token for Compute Mint with 6 decimals...');

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

        // Initialize Umi
        const connection = new Connection(process.env.RPC_URL, "confirmed");
        const umi = createUmi(connection).use(mplTokenMetadata());

        // Load and convert keypair
        const payerKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(require('fs').readFileSync(process.env.PAYER_KEYPAIR_PATH, 'utf-8')))
        );

        // Convert Web3.js Keypair to Umi-compatible Signer
        const umiKeypair = fromWeb3JsKeypair(payerKeypair);
        const umiSigner = createSignerFromKeypair(umi, umiKeypair);

        // Configure Umi with both identity and payer
        umi
            .use(signerIdentity(umiSigner))
            .use(signerPayer(umiSigner));


        // Create mint with metadata (Umi style)
        Logger.startSpinner('Creating token mint and metadata...');

        const signerKeypair = Keypair.fromSecretKey(
            umiSigner.secretKey
        );
        // const { signature, result } = await createV1(umi, {
        //     mint,
        //     authority: umiSigner,
        //     payer: umiSigner,
        //     name: "Compute Token",
        //     symbol: "COMPUTE",
        //     uri: "https://example.com/compute-token-metadata.json",
        //     sellerFeeBasisPoints: percentAmount(0),
        //     tokenStandard: TokenStandard.Fungible,
        //     decimals: 6
        // }).sendAndConfirm(umi);

        //Logger.spinnerSuccess(`Token created: ${mint.publicKey.toString()}.`);

        // Mint tokens
        Logger.startSpinner('Creating ATA...');


        const computeMint = await createMint(
            connection,
            signerKeypair,
            signerKeypair.publicKey,
            null,
            6
        )


        console.log("Creating ATA...");
        const associatedAccount = anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: signerKeypair.publicKey
        });
        console.log("Associated Account:", associatedAccount.toString());
        const ata = await createAssociatedTokenAccount(
            connection,
            signerKeypair,
            computeMint,
            signerKeypair.publicKey,
        );
        console.log("ATA created:", ata.toString());
        Logger.spinnerSuccess(`ATA created: ${ata.toString()}.`);

        Logger.startSpinner('Minting 720,000,000 tokens...');
        console.log("Minting 720,000,000 tokens...");
        const mintToIx = await mintTo(
            connection,
            signerKeypair,
            computeMint,
            ata,
            signerKeypair,
            720_000_000_000_000n,
        );
        Logger.spinnerSuccess(`Minted 720,000,000 tokens.`);
        // const { signature: mintSignature, result: mintResult } = await mintV1(umi, {
        //     mint: mint.publicKey,
        //     authority: umiSigner,
        //     amount: 720_000_000_000_000n, // 720M * 10^6
        //     tokenOwner: umiKeypair.publicKey,
        //     tokenStandard: TokenStandard.Fungible
        // }).sendAndConfirm(umi);
        Logger.spinnerSuccess(`Token created: ${computeMint.toString()}.`);

        console.log("Compute Mint Address:", computeMint.toString());
        console.log("To set this as the external compute mint, use the set-external-compute.ts script with this address");

    } catch (error: any) {
        Logger.spinnerError('Failed to create Compute Mint. Cause: ' + error.message);
        process.exit(1);
    }
}

main();
