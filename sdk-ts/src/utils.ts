import { Cluster, Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import IDL from '../../target/idl/ainft.json'
import { Ainft } from '../../target/types/ainft'

import dotenv from 'dotenv';
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token';
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
dotenv.config();

export const PROGRAM_ID = new PublicKey("3R1GZLu9iJHwLLvfwBXfWWW6s8tLsLcgSJCckwrnGQLD");

export function getConnection(): Connection {
    const network = process.env.NETWORK || 'devnet';
    if (network === 'localnet') {
        return new Connection("http://127.0.0.1:8899", {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 10000,
        });
    }
    if (network === 'sonic-testnet') {
        return new Connection("https://api.testnet.sonic.game", {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 10000,
        });
    }
    return new Connection(clusterApiUrl(network as Cluster), {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 10000,
    });
}

export function getPayer(): Keypair {
    if (!process.env.PAYER_KEYPAIR_PATH) {
        throw new Error('PAYER_KEYPAIR_PATH is required in .env file');
    }
    const keypair = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require('fs').readFileSync(process.env.PAYER_KEYPAIR_PATH!, 'utf-8')))
    );
    return keypair;
}

export async function getProvider(): Promise<AnchorProvider> {
    const connection = getConnection();
    const latestBlockhash = await connection.getLatestBlockhash();
    console.log(latestBlockhash);
    const payer = getPayer();
    const wallet = new Wallet(payer);
    return new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
    });
}

export async function getProgram(): Promise<Program<Ainft>> {
    const provider = await getProvider();
    return new Program<Ainft>(IDL as Ainft, provider);
}

export function findMasterMintPDA(): [PublicKey, number] {
    const [appAinftPda] = findAppAinftPDA();
    return PublicKey.findProgramAddressSync(
        [Buffer.from("master_mint"), appAinftPda.toBuffer()],
        PROGRAM_ID
    );
}

export function findAppAinftPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("app_ainft")],
        PROGRAM_ID
    );
}

// find liqiod staking token mint
export function findLiquidStakingTokenMintPDA(appAinft: PublicKey, executionClient: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("staked_mint"), appAinft.toBuffer(), executionClient.toBuffer()],
        PROGRAM_ID
    );
}


export function findComputeMintPDA(): [PublicKey, number] {
    const [appAinftPda] = findAppAinftPDA();
    return PublicKey.findProgramAddressSync(
        [Buffer.from("compute_mint"), appAinftPda.toBuffer()],
        PROGRAM_ID
    );
}

export function findMetadataPDA(masterMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), masterMint.toBuffer()],
        METADATA_PROGRAM_ID
    );
}

export function findComputeMetadataPDA(computeMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), computeMint.toBuffer()],
        METADATA_PROGRAM_ID
    );
}

export function findAiCharacterPDA(
    aiCharacterMint: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("ainft"), aiCharacterMint.toBuffer()],
        PROGRAM_ID
    );
}

export function findAiCharacterMintPDA(
    aiNft: PublicKey,
    name: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("premint"), aiNft.toBuffer(), Buffer.from(name)],
        PROGRAM_ID
    );
}

export function findExecutionClientPDA(
    appAinft: PublicKey,
    authority: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("execution_client"),
            appAinft.toBuffer(),
            authority.toBuffer(),
        ],
        PROGRAM_ID
    );
}

export function findStakerPDA(
    executionClient: PublicKey,
    authority: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("staker"),
            executionClient.toBuffer(),
            authority.toBuffer(),
        ],
        PROGRAM_ID
    );
}

export function findMessagePDA(
    appAinft: PublicKey,
    aiCharacter: PublicKey,
    messageCount: BN
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("message"),
            appAinft.toBuffer(),
            aiCharacter.toBuffer(),
            messageCount.toArrayLike(Buffer, "le", 8),
        ],
        PROGRAM_ID
    );
}

export function findAiCharacterComputeTokenAccount(
    aiCharacter: PublicKey
): PublicKey {
    const [computeMint] = findComputeMintPDA();
    return associatedAddress({
        mint: computeMint,
        owner: aiCharacter
    });
}

export function findCollectionPDA(
    authority: PublicKey,
    name: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("collection"),
            authority.toBuffer(),
            Buffer.from(name),
        ],
        PROGRAM_ID
    );
}

export function findPremintedNftMintPDA(
    collection: PublicKey,
    name: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("premint"),
            collection.toBuffer(),
            Buffer.from(name),
        ],
        PROGRAM_ID
    );
}

/// Find the PDA for a character config
export function findCharacterConfigPDA(
    authority: PublicKey,
    id: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("character_config"), authority.toBuffer(), Buffer.from(id)],
        PROGRAM_ID
    );
}
