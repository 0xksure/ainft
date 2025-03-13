'use client';
import anchor, { utils } from '@coral-xyz/anchor';
import { useEffect, useState } from 'react';
import { PublicKey, Keypair, Transaction, sendAndConfirmTransaction, VersionedTransaction, Connection, TransactionMessage } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, web3, BN } from '@coral-xyz/anchor';
import { useAnchorWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import { Ainft } from "../../../target/types/ainft";
import IDL from '../../../target/idl/ainft.json'

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export function findAppAinftPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("app_ainft")],
        AINFT_PROGRAM_ID
    );
}

export function findAiCharacterPDA(
    aiCharacterMint: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("ainft"), aiCharacterMint.toBuffer()],
        AINFT_PROGRAM_ID
    );
}

export function findAiCharacterMintPDA(
    aiNft: PublicKey,
    name: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), aiNft.toBuffer(), Buffer.from(name)],
        AINFT_PROGRAM_ID
    );
}

export function findMetadataPDA(masterMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), masterMint.toBuffer()],
        METADATA_PROGRAM_ID
    );
}

// Define the AINFT program ID
export const AINFT_PROGRAM_ID = new PublicKey('14M8GDtWobqndjTrJ4sDZJ2CY74TXyGWGJzJoAE4TNYh');

// Define the network types
export type Network = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet' | 'sonic-devnet';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get the cluster URL based on the network
export const getClusterUrl = (network: Network): string => {
    // For server-side rendering, return a default URL
    if (!isBrowser) return 'https://api.devnet.solana.com';

    switch (network) {
        case 'mainnet-beta':
            return 'https://api.mainnet-beta.solana.com';
        case 'devnet':
            return 'https://api.devnet.solana.com';
        case 'testnet':
            return 'https://api.testnet.solana.com';
        case 'localnet':
            return 'http://localhost:8899';
        case 'sonic-devnet':
            return 'https://api.testnet.sonic.game';
        default:
            return 'https://api.devnet.solana.com';
    }
};

// Define the AINFT IDL
export interface AiNftIDL {
    version: string;
    name: string;
    instructions: any[];
    accounts: any[];
    types: any[];
}

// Helper function to convert string to byte array (for style fields)
export const stringToByteArray = (str: string, length: number): number[] => {
    const bytes = new Uint8Array(length);
    const strBytes = new TextEncoder().encode(str);

    // Copy the string bytes into the fixed-length array
    for (let i = 0; i < Math.min(strBytes.length, length); i++) {
        bytes[i] = strBytes[i];
    }

    return Array.from(bytes);
};

// Define the character configuration interface
export interface CharacterConfig {
    name: string;
    clients: string[];
    modelProvider: string;
    settings: {
        voice: {
            model: string;
        };
    };
    bio: string[];
    lore: string[];
    knowledge: string[];
    topics: string[];
    style: any;
    adjectives: string[];
}

// Hook to get the Anchor program
export const useAnchorProgram = () => {
    const wallet = useAnchorWallet();
    const { network, connection } = useNetworkStore();
    const [program, setProgram] = useState<Program<Ainft> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Skip during SSR
        if (!isBrowser) return;

        // Skip if no connection
        if (!connection) return;

        const loadProgram = async () => {
            try {
                setLoading(true);

                // If wallet is connected, use it for the provider
                if (wallet) {
                    const provider = new AnchorProvider(
                        connection,
                        wallet,
                        { preflightCommitment: 'confirmed' }
                    );

                    // In a real app, you would fetch the IDL from the chain or import it
                    // For now, we'll use a placeholder and assume the program is loaded
                    console.log('Initializing program with ID:', AINFT_PROGRAM_ID.toString());
                    console.log('Using network:', network);
                    console.log('Wallet connected:', wallet.publicKey.toString());

                    // This is a placeholder - in a real app, you'd load the actual IDL
                    const idl = await Program.fetchIdl(AINFT_PROGRAM_ID, provider);
                    console.log("idl", idl);
                    const program = new Program<Ainft>(IDL as Ainft, provider);

                    // For now, we'll just set a placeholder program
                    setProgram(program);
                } else {
                    // For read-only operations with no wallet
                    console.log('No wallet connected, read-only mode');
                    setProgram(null);
                }

                setError(null);
            } catch (err) {
                console.error('Error initializing program:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
                setProgram(null);
            } finally {
                setLoading(false);
            }
        };

        loadProgram();
    }, [wallet, connection, network]);

    return { program, loading, error };
};

// Create an AI NFT
export const createAiNft = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    config: CharacterConfig
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet) throw new Error('Wallet not initialized');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Convert the character config to the format expected by the program
        const createAiNftParams = {
            name: config.name,
            clients: config.clients,
            modelProvider: config.modelProvider,
            settings: {
                voice: {
                    model: config.settings.voice.model,
                }
            },
            bio: config.bio,
            lore: config.lore,
            knowledge: config.knowledge,
            topics: config.topics,
            style: config.style,
            adjectives: config.adjectives,
        };

        // Generate a new keypair for the AI NFT
        const aiNftKeypair = Keypair.generate();

        const [appAinftPda] = findAppAinftPDA();
        const [aiCharacterMint] = findAiCharacterMintPDA(appAinftPda, config.name);
        const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);
        const [aiCharacterMetadata] = findMetadataPDA(aiCharacterMint);
        const payerAiCharacterTokenAccount = await utils.token.associatedAddress({
            mint: aiCharacterMint,
            owner: wallet.publicKey
        });

        // Call the create_app_ainft instruction
        console.log("program", program.methods);
        const ix = await program.methods
            .mintAinft(
                config.name,
                "https://ok.no",
            )
            .accounts({
                payer: wallet.publicKey,
                aiNft: appAinftPda,
                aiCharacter: aiCharacter,
                aiCharacterMint: aiCharacterMint,
                aiCharacterMetadata: aiCharacterMetadata,
                payerAiCharacterTokenAccount: payerAiCharacterTokenAccount,
            })
            .instruction();

        const latestBlockhash = await connection.getLatestBlockhash('confirmed');

        // 3. Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        });
        if (confirmation.value.err) {
            throw new Error("Transaction failed to confirm");
        }
        console.log('Transaction confirmed:', confirmation);
        console.log('Transaction confirmed:', signature);
        console.log('AI NFT created with se:', signature);
        console.log('AI NFT address:', aiNftKeypair.publicKey.toString());

        return {
            txId: confirmation.value,
            aiNftAddress: aiNftKeypair.publicKey,
        };
    } catch (error) {
        console.error('Error creating AI NFT:', error);
        throw error;
    }
};

// Mint an AI NFT
export const mintAiNft = async (
    program: any,
    wallet: PublicKey,
    name: string,
    uri: string
) => {
    if (!program) throw new Error('Program not initialized');

    try {
        // Call the mint_ainft instruction
        const tx = await program.methods
            .mintAinft(name, uri)
            .accounts({
                authority: wallet,
                // Other accounts would be derived based on the program's requirements
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        console.log('AI NFT minted with transaction:', tx);

        return {
            txId: tx,
        };
    } catch (error) {
        console.error('Error minting AI NFT:', error);
        throw error;
    }
};

// Send a message to an AI NFT
export async function sendMessage(
    program: Program<any>,
    sender: PublicKey,
    aiNftAddress: PublicKey,
    messageText: string
) {
    try {
        // Generate a new keypair for the message account
        const messageAccount = Keypair.generate();

        // Fetch the AI character account associated with the NFT
        const aiCharacter = await program.account.aiCharacterNft.fetch(aiNftAddress);

        // Derive the compute token account for the AI character
        const [aiCharacterComputeTokenAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("compute_token"), aiCharacter.characterNftMint.toBuffer()],
            program.programId
        );

        // Create the instruction
        const instruction = await program.methods
            .sendMessage(messageText)
            .accounts({
                message: messageAccount.publicKey,
                aiNft: aiNftAddress,
                aiCharacter: aiCharacter.publicKey,
                computeToken: aiCharacterComputeTokenAccount,
                sender: sender,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await program.provider.connection.getLatestBlockhash();

        // Create a versioned transaction
        const messageTransaction = new VersionedTransaction(
            new TransactionMessage({
                payerKey: sender,
                recentBlockhash: blockhash,
                instructions: [instruction],
            }).compileToV0Message()
        );

        // Sign the transaction
        messageTransaction.sign([messageAccount]);

        // Send the transaction
        const signature = await program.provider.connection.sendTransaction(messageTransaction);

        // Wait for confirmation
        await program.provider.connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        });

        return {
            txId: signature,
            messageAccount: messageAccount.publicKey,
        };
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

// Register an execution client
export const registerExecutionClient = async (
    program: any,
    wallet: PublicKey,
    gas: number,
    supportedMessageTypes: string[],
    stakerFeeShare: number
) => {
    if (!program) throw new Error('Program not initialized');

    try {
        // Find the execution client PDA
        const [executionClientPda, executionClientBump] = PublicKey.findProgramAddressSync(
            [Buffer.from('execution_client'), wallet.toBuffer()],
            program.programId
        );

        // Call the register_execution_client instruction
        const tx = await program.methods
            .registerExecutionClient(
                new BN(gas),
                supportedMessageTypes,
                stakerFeeShare,
                executionClientBump
            )
            .accounts({
                executionClient: executionClientPda,
                authority: wallet,
                // Other accounts would be derived based on the program's requirements
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        console.log('Execution client registered with transaction:', tx);
        console.log('Execution client address:', executionClientPda.toString());

        return {
            txId: tx,
            executionClientAddress: executionClientPda,
        };
    } catch (error) {
        console.error('Error registering execution client:', error);
        throw error;
    }
};

// Stake compute tokens
export const stakeCompute = async (
    program: any,
    wallet: PublicKey,
    amount: number
) => {
    if (!program) throw new Error('Program not initialized');

    try {
        // Call the stake_compute instruction
        const tx = await program.methods
            .stakeCompute(new BN(amount))
            .accounts({
                authority: wallet,
                // Other accounts would be derived based on the program's requirements
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        console.log('Compute tokens staked with transaction:', tx);

        return {
            txId: tx,
        };
    } catch (error) {
        console.error('Error staking compute tokens:', error);
        throw error;
    }
};

// Unstake compute tokens
export const unstakeCompute = async (
    program: any,
    wallet: PublicKey,
    amount: number
) => {
    if (!program) throw new Error('Program not initialized');

    try {
        // Call the unstake_compute instruction
        const tx = await program.methods
            .unstakeCompute(new BN(amount))
            .accounts({
                authority: wallet,
                // Other accounts would be derived based on the program's requirements
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        console.log('Compute tokens unstaked with transaction:', tx);

        return {
            txId: tx,
        };
    } catch (error) {
        console.error('Error unstaking compute tokens:', error);
        throw error;
    }
};

// Update character configuration
export const updateCharacterConfig = async (
    program: any,
    wallet: PublicKey,
    aiNftAddress: PublicKey,
    config: CharacterConfig
) => {
    if (!program) throw new Error('Program not initialized');

    try {
        // Convert the character config to the format expected by the program
        const characterConfigInput = {
            name: config.name,
            clients: config.clients,
            modelProvider: config.modelProvider,
            settings: {
                voice: {
                    model: config.settings.voice.model,
                }
            },
            bio: config.bio,
            lore: config.lore,
            knowledge: config.knowledge,
            topics: config.topics,
            style: config.style,
            adjectives: config.adjectives,
        };

        // Call the update_character_config instruction
        const tx = await program.methods
            .updateCharacterConfig(characterConfigInput)
            .accounts({
                aiNft: aiNftAddress,
                authority: wallet,
                // Other accounts would be derived based on the program's requirements
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        console.log('Character config updated with transaction:', tx);

        return {
            txId: tx,
        };
    } catch (error) {
        console.error('Error updating character config:', error);
        throw error;
    }
};

export async function getMessagesForAiNft(
    program: Program<any>,
    aiNftAddress: PublicKey
) {
    try {
        // Fetch all messages for the specific AI NFT
        const messages = await program.account.message.all([
            {
                memcmp: {
                    offset: 8, // Skip the discriminator
                    bytes: aiNftAddress.toBase58(),
                },
            },
        ]);

        // Sort messages by timestamp (assuming there's a timestamp field)
        return messages.sort((a, b) => {
            const timestampA = a.account.timestamp?.toNumber() || 0;
            const timestampB = b.account.timestamp?.toNumber() || 0;
            return timestampA - timestampB;
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
    }
} 