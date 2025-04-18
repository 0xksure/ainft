'use client';
import * as anchor from '@coral-xyz/anchor';
import { useEffect, useState } from 'react';
import { Connection, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, VersionedTransaction, Keypair, TransactionMessage } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, web3, BN, utils } from '@coral-xyz/anchor';
import { useAnchorWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import { Ainft } from "../../../target/types/ainft";
import IDL from '../../../target/idl/ainft.json'
import * as splToken from '@solana/spl-token';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export function findAppAinftPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("app_ainft")],
        AINFT_PROGRAM_ID
    );
}

export function findComputeMintPDA(): [PublicKey, number] {
    const [appAinftPda] = findAppAinftPDA();
    return PublicKey.findProgramAddressSync(
        [Buffer.from("compute_mint"), appAinftPda.toBuffer()],
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

export function findCollectionPDA(
    authority: PublicKey,
    name: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), authority.toBuffer(), Buffer.from(name)],
        AINFT_PROGRAM_ID
    );
}

export function findCollectionMintPDA(
    collection: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("collection_mint"), collection.toBuffer()],
        AINFT_PROGRAM_ID
    );
}

export function findPremintedNftMintPDA(
    collection: PublicKey,
    name: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("premint"), collection.toBuffer(), Buffer.from(name)],
        AINFT_PROGRAM_ID
    );
}

export function findCharacterConfigPDA(
    authority: PublicKey,
    configId: string
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("character_config"), authority.toBuffer(), Buffer.from(configId)],
        AINFT_PROGRAM_ID
    );
}

// Define the AINFT program ID
export const AINFT_PROGRAM_ID = new PublicKey('ArLePiNppazCKH1obDtf6BVUaid7h5YxEpP4UGpjMqo5');

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

// Get program instance
export const getProgram = async (): Promise<Program<Ainft>> => {
    // Initialize a connection using the network from the store
    const { network, connection } = useNetworkStore.getState();
    if (!connection) {
        throw new Error('No connection available');
    }

    // Create a read-only provider (no wallet needed)
    const provider = new AnchorProvider(
        connection,
        // Use a dummy wallet since we're only reading data
        {
            publicKey: Keypair.generate().publicKey,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
        } as any,
        { preflightCommitment: 'confirmed' }
    );

    // Initialize program with IDL
    return new Program<Ainft>(IDL as Ainft, provider);
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
    config: CharacterConfig,
    url: string
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
        console.log("payerAiCharacterTokenAccount", payerAiCharacterTokenAccount);
        console.log("aiCharacter", aiCharacter);
        console.log("aiCharacterMint", aiCharacterMint);
        console.log("aiCharacterMetadata", aiCharacterMetadata);
        console.log("appAinftPda", appAinftPda);

        // Call the create_app_ainft instruction
        console.log("program", program.methods);
        const ix = await program.methods
            .mintAinft(
                config.name,
                url
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

        const [computeMint] = findComputeMintPDA();
        const aiCharacterComputeTokenAccount = await anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: aiCharacter
        });
        const computeTokenAccount = await program.methods
            .createAiCharacterComputeAccount()
            .accounts({
                aiCharacter: aiCharacter,
                computeMint: computeMint,
                aiCharacterComputeTokenAccount,
                payer: wallet.publicKey,
            })
            .instruction();
        const latestBlockhash = await connection.getLatestBlockhash('confirmed');

        // 3. Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [ix, computeTokenAccount]
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
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    aiNftAddress: PublicKey,
    messageText: string
) {
    try {
        if (!wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        if (!wallet.signTransaction) {
            throw new Error("Wallet does not support signing transactions");
        }

        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();
        const [computeMint] = findComputeMintPDA();

        // Get the AI character's compute token account
        const aiCharacterComputeTokenAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: aiNftAddress
        });

        const senderComputeTokenAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: wallet.publicKey
        });

        // Check if the compute token account exists
        const accountInfo = await connection.getAccountInfo(aiCharacterComputeTokenAccount);
        if (!accountInfo) {
            console.log("Compute token account does not exist, creating it now...");

            // Create the compute token account
            await createAiCharacterComputeAccount(
                program,
                wallet,
                connection,
                aiNftAddress
            );

            console.log("Compute token account created successfully");
        }

        // Get message count for PDA seed
        const messageCount = (await program.account.aiCharacterNft.fetch(aiNftAddress)).messageCount;
        const [messageAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("message"),
                appAinftPda.toBuffer(),
                aiNftAddress.toBuffer(),
                new BN(messageCount).toArrayLike(Buffer, 'le', 8)  // Ensure correct byte format
            ],
            program.programId
        );


        console.log("aiCharacterComputeTokenAccount", aiCharacterComputeTokenAccount);
        console.log("aiCharacter", aiNftAddress);
        console.log("aiNft", appAinftPda);
        console.log("sender", wallet.publicKey);
        console.log("messageAccount", messageAccount);
        console.log("computeToken", aiCharacterComputeTokenAccount);

        // Create the instruction
        const ix = await program.methods
            .sendMessage(messageText)
            .accounts({
                message: messageAccount,
                aiNft: appAinftPda,
                aiCharacter: aiNftAddress,
                computeToken: aiCharacterComputeTokenAccount,
                computeTokenReceiver: aiCharacterComputeTokenAccount,
                senderComputeToken: senderComputeTokenAccount,
                sender: wallet.publicKey,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await program.provider.connection.getLatestBlockhash();
        // 3. Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: blockhash,
            lastValidBlockHeight: lastValidBlockHeight
        });
        if (confirmation.value.err) {
            throw new Error("Transaction failed to confirm");
        }

        return {
            signature,
            messageAccount
        };
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Fetch all execution clients
export const fetchAllExecutionClients = async (program: Program<Ainft>, connection: Connection) => {
    try {
        const executionClients = await program.account.executionClient.all();
        return executionClients;
    } catch (error) {
        console.error("Error fetching execution clients:", error);
        return [];
    }
};

// Fetch execution client by authority
export const fetchExecutionClientByAuthority = async (
    program: Program<Ainft>,
    authority: PublicKey
) => {
    if (!program) throw new Error('Program not initialized');

    try {
        // Find the app ainft PDA
        const [appAinftPda] = findAppAinftPDA();

        // Find the execution client PDA
        const [executionClientPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('execution_client'), appAinftPda.toBuffer(), authority.toBuffer()],
            program.programId
        );

        // Fetch the execution client account
        const executionClient = await program.account.executionClient.fetch(executionClientPda);

        return {
            publicKey: executionClientPda,
            aiNft: executionClient.aiNft,
            authority: executionClient.authority,
            computeTokenAddress: executionClient.computeTokenAddress,
            gas: executionClient.gas.toNumber(),
            computeMint: executionClient.computeMint,
            liquidStakingTokenMint: executionClient.liquidStakingTokenMint,
            stakePoolTokenAccount: executionClient.stakePoolTokenAccount,
            totalCompute: executionClient.totalCompute.toNumber(),
            totalStaked: executionClient.totalStaked.toNumber(),
            totalProcessed: executionClient.totalProcessed.toNumber(),
            stakerFeeShare: executionClient.stakerFeeShare,
            active: executionClient.active,
            supportedMessageTypes: executionClient.supportedMessageTypes,
        };
    } catch (error) {
        console.error('Error fetching execution client:', error);
        return null;
    }
};

// Register an execution client
export const registerExecutionClient = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    gas: number,
    supportedMessageTypes: string[],
    stakerFeeShare: number
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet) throw new Error('Wallet not initialized');
    if (!wallet.publicKey) throw new Error('Wallet public key not initialized');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');
    try {
        // Find the app ainft PDA
        const [appAinftPda] = findAppAinftPDA();

        // Find the execution client PDA
        const [executionClientPda, executionClientBump] = PublicKey.findProgramAddressSync(
            [Buffer.from('execution_client'), appAinftPda.toBuffer(), wallet.publicKey.toBuffer()],
            program.programId
        );

        // Find the compute mint PDA
        const [computeMint] = findComputeMintPDA();

        // Find the compute token account for the execution client
        const computeTokenAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: executionClientPda
        });

        // Find the staked token account for the app ainft
        const stakedTokenAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: appAinftPda
        });

        // Find the staked mint PDA
        const [stakedMint] = PublicKey.findProgramAddressSync(
            [Buffer.from('staked_mint'), appAinftPda.toBuffer(), executionClientPda.toBuffer()],
            program.programId
        );

        // Create an accounts object with all required accounts
        const accounts = {
            aiNft: appAinftPda,
            executionClient: executionClientPda,
            computeTokenAccount: computeTokenAccount,
            stakedTokenAccount: stakedTokenAccount,
            computeMint: computeMint,
            signer: wallet.publicKey,
            stakedMint: stakedMint,
        };

        // Call the register_execution_client instruction
        const tx = await program.methods
            .registerExecutionClient(
                new BN(gas),
                supportedMessageTypes,
                stakerFeeShare,
                executionClientBump
            )
            .accounts(accounts)
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        // 3. Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [tx]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });
        if (confirmation.value.err) {
            throw new Error("Transaction failed to confirm");
        }

        // Wait for confirmation
        await program.provider.connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        });

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

// Update execution client configuration
export const updateExecutionClientConfig = async (
    program: Program<Ainft>,
    wallet: PublicKey,
    gas: number,
    executionClientPublicKey?: PublicKey
) => {
    if (!program) throw new Error('Program not initialized');

    try {
        let executionClientPda: PublicKey;

        if (executionClientPublicKey) {
            // Use the provided execution client public key
            executionClientPda = executionClientPublicKey;
        } else {
            // Find the execution client PDA based on the wallet
            const [appAinftPda] = findAppAinftPDA();
            [executionClientPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('execution_client'), appAinftPda.toBuffer(), wallet.toBuffer()],
                program.programId
            );
        }

        // Create an accounts object with all required accounts
        const accounts = {
            executionClient: executionClientPda,
            authority: wallet,
        };

        // Call the update_execution_client_config instruction
        const tx = await program.methods
            .updateExecutionClientConfig(
                new BN(gas)
            )
            .accounts(accounts)
            .rpc();

        console.log('Execution client config updated with transaction:', tx);

        return {
            txId: tx,
            executionClientAddress: executionClientPda,
        };
    } catch (error) {
        console.error('Error updating execution client config:', error);
        throw error;
    }
};

// Create a stake account for compute tokens
export const createStakeAccount = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    executionClientAddress?: PublicKey
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();
        const [computeMint] = findComputeMintPDA();

        // Get execution client info
        const executionClient = executionClientAddress || await fetchExecutionClientByAuthority(program, wallet.publicKey);
        if (!executionClient) {
            throw new Error('No execution client found for this wallet');
        }

        // Check if execution client is a PublicKey or an account object
        const executionClientKey = executionClient instanceof PublicKey
            ? executionClient
            : executionClient.publicKey;

        // Find staker account PDA
        const [staker] = PublicKey.findProgramAddressSync(
            [Buffer.from("staker"), executionClientKey.toBuffer(), wallet.publicKey.toBuffer()],
            program.programId
        );

        // Create staker token account
        const stakerTokenAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: wallet.publicKey
        });

        // Create instruction
        const ix = await program.methods
            .createStakeAccount()
            .accounts({
                aiNft: appAinftPda,
                executionClient: executionClientKey,
                staker: staker,
                stakerTokenAccount: stakerTokenAccount,
                computeMint: computeMint,
                authority: wallet.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: web3.SYSVAR_RENT_PUBKEY
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        console.log('Stake account created with transaction:', signature);

        return {
            txId: signature,
            staker
        };
    } catch (error) {
        console.error('Error creating stake account:', error);
        throw error;
    }
};

// Stake compute tokens
export const stakeCompute = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    amount: BN,
    executionClientAddress?: PublicKey
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();
        const [computeMint] = findComputeMintPDA();

        // Get execution client info
        const executionClient = executionClientAddress || await fetchExecutionClientByAuthority(program, wallet.publicKey);
        if (!executionClient) {
            throw new Error('No execution client found for this wallet');
        }

        // Check if execution client is a PublicKey or an account object
        const executionClientKey = executionClient instanceof PublicKey
            ? executionClient
            : executionClient.publicKey;

        // Find staker account PDA
        const [staker] = PublicKey.findProgramAddressSync(
            [Buffer.from("staker"), executionClientKey.toBuffer(), wallet.publicKey.toBuffer()],
            program.programId
        );

        // Create or find token accounts
        const stakerComputeAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: wallet.publicKey
        });

        const [stakedMint] = PublicKey.findProgramAddressSync(
            [Buffer.from("staked_mint"), appAinftPda.toBuffer(), executionClientKey.toBuffer()],
            program.programId
        );

        const stakedTokenAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: appAinftPda
        });

        const authorityLiquidStakingTokenAccount = await utils.token.associatedAddress({
            mint: stakedMint,
            owner: wallet.publicKey
        });

        // Create instruction
        const ix = await program.methods
            .stakeCompute(amount)
            .accounts({
                aiNft: appAinftPda,
                executionClient: executionClientKey,
                stakePoolTokenAccount: stakedTokenAccount,
                liquidStakingTokenMint: stakedMint,
                authorityComputeAccount: stakerComputeAccount,
                authorityLiquidStakingTokenAccount: authorityLiquidStakingTokenAccount,
                stakerAccount: staker,
                authority: wallet.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: web3.SYSVAR_RENT_PUBKEY
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        console.log('Compute tokens staked with transaction:', signature);

        return {
            txId: signature
        };
    } catch (error) {
        console.error('Error staking compute tokens:', error);
        throw error;
    }
};

// Unstake compute tokens
export const unstakeCompute = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    amount: BN,
    executionClientAddress?: PublicKey
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();
        const [computeMint] = findComputeMintPDA();

        // Get execution client info
        const executionClient = executionClientAddress || await fetchExecutionClientByAuthority(program, wallet.publicKey);
        if (!executionClient) {
            throw new Error('No execution client found for this wallet');
        }

        // Check if execution client is a PublicKey or an account object
        const executionClientKey = executionClient instanceof PublicKey
            ? executionClient
            : executionClient.publicKey;

        // Find staker account PDA
        const [staker] = PublicKey.findProgramAddressSync(
            [Buffer.from("staker"), executionClientKey.toBuffer(), wallet.publicKey.toBuffer()],
            program.programId
        );

        // Create or find token accounts
        const stakerComputeAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: wallet.publicKey
        });

        const [stakedMint] = PublicKey.findProgramAddressSync(
            [Buffer.from("staked_mint"), appAinftPda.toBuffer(), executionClientKey.toBuffer()],
            program.programId
        );

        const stakedTokenAccount = await utils.token.associatedAddress({
            mint: computeMint,
            owner: appAinftPda
        });

        const authorityLiquidStakingTokenAccount = await utils.token.associatedAddress({
            mint: stakedMint,
            owner: wallet.publicKey
        });

        // Create instruction
        const ix = await program.methods
            .unstakeCompute(amount)
            .accounts({
                aiNft: appAinftPda,
                executionClient: executionClientKey,
                liquidStakingTokenMint: stakedMint,
                stakePoolTokenAccount: stakedTokenAccount,
                authorityComputeAccount: stakerComputeAccount,
                authorityLiquidStakingTokenAccount: authorityLiquidStakingTokenAccount,
                stakerAccount: staker,
                authority: wallet.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        console.log('Compute tokens unstaked with transaction:', signature);

        return {
            txId: signature
        };
    } catch (error) {
        console.error('Error unstaking compute tokens:', error);
        throw error;
    }
};

// Get compute token balance for a wallet
export const getComputeTokenBalance = async (
    connection: Connection,
    walletPublicKey: PublicKey
): Promise<number> => {
    try {
        console.log('Fetching compute token balance for wallet:', walletPublicKey.toString());

        // Get the App AiNFT account to find the actual compute mint
        const [appAinftPda] = findAppAinftPDA();

        // Fetch the AiNft state account to get the real compute mint
        const program = await getProgram();
        const appAinftAccount = await program.account.aiNft.fetch(appAinftPda);
        const computeMint = appAinftAccount.computeMint;

        console.log('Actual compute token mint address:', computeMint.toString());

        // Find the associated token account for the wallet
        const tokenAccount = await anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: walletPublicKey
        });
        console.log('Associated token address:', tokenAccount.toString());

        // Check if the token account exists
        const accountInfo = await connection.getAccountInfo(tokenAccount);
        if (!accountInfo) {
            console.log('Token account does not exist, returning 0 balance');
            return 0;
        }

        try {
            // Get the token account balance
            const tokenAmount = await connection.getTokenAccountBalance(tokenAccount);

            // Convert to number and return
            const balance = tokenAmount.value.uiAmount || 0;
            console.log('Compute token balance:', balance);
            return balance;
        } catch (error) {
            console.error('Error getting token balance:', error);
            return 0;
        }
    } catch (error) {
        console.error('Error in getComputeTokenBalance:', error);
        // Return 0 instead of throwing to prevent UI errors
        return 0;
    }
};

// Get compute token balance for an AI character
export const getAiCharacterComputeTokenBalance = async (
    connection: Connection,
    aiCharacterMint: PublicKey
): Promise<number> => {
    try {
        console.log('Fetching compute token balance for AI character:', aiCharacterMint.toString());

        // Get the App AiNFT account to find the actual compute mint
        const [appAinftPda] = findAppAinftPDA();

        // Fetch the AiNft state account to get the real compute mint
        const program = await getProgram();
        const appAinftAccount = await program.account.aiNft.fetch(appAinftPda);
        const computeMint = appAinftAccount.computeMint;

        console.log('Using compute token mint address:', computeMint.toString());

        // Find the AI character PDA
        const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);

        // Find the associated token account for the AI character
        const tokenAccount = anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: aiCharacter
        });

        // Check if the token account exists
        const accountInfo = await connection.getAccountInfo(tokenAccount);
        if (!accountInfo) {
            console.log('AI character token account does not exist, returning 0 balance');
            return 0;
        }

        try {
            // Get the token account balance
            const tokenAmount = await connection.getTokenAccountBalance(tokenAccount);

            // Convert to number and return
            const balance = tokenAmount.value.uiAmount || 0;
            console.log('AI character compute token balance:', balance);
            return balance;
        } catch (error) {
            console.error('Error getting AI character token balance:', error);
            return 0;
        }
    } catch (error) {
        console.error('Error in getAiCharacterComputeTokenBalance:', error);
        // Return 0 instead of throwing to prevent UI errors
        return 0;
    }
};

// Get the compute mint address from on-chain AiNft state
export const getComputeMint = async (
    program: Program<Ainft>
): Promise<PublicKey> => {
    try {
        // Find the AiNft PDA
        const [appAinftPda] = findAppAinftPDA();

        // Fetch the AiNft account data
        const appAinftAccount = await program.account.aiNft.fetch(appAinftPda);

        // Get the compute mint address
        const computeMint = appAinftAccount.computeMint;

        console.log('Fetched compute mint from state:', computeMint.toString());

        return computeMint;
    } catch (error) {
        console.error('Error getting compute mint from AiNft state:', error);

        // Fallback to the PDA-derived mint as a last resort
        const [computeMintPda] = findComputeMintPDA();
        console.warn('Falling back to PDA-derived compute mint:', computeMintPda.toString());

        return computeMintPda;
    }
};

// Get both agent and wallet compute balances in one call
export const getComputeBalances = async (
    program: Program<Ainft>,
    connection: Connection,
    walletPublicKey: PublicKey | null,
    aiCharacterMint: PublicKey | null
): Promise<{ walletBalance: number, agentBalance: number }> => {
    try {
        // Default balance values
        let walletBalance = 0;
        let agentBalance = 0;

        // Get the compute mint address from the AiNft state
        const computeMint = await getComputeMint(program);

        // Get wallet balance if wallet is connected
        if (walletPublicKey !== null) {
            // Find the associated token account for the wallet
            const walletTokenAccount = await anchor.utils.token.associatedAddress({
                mint: computeMint,
                owner: walletPublicKey
            });

            // Check if the token account exists
            const walletAccountInfo = await connection.getAccountInfo(walletTokenAccount);
            if (walletAccountInfo) {
                const tokenAmount = await connection.getTokenAccountBalance(walletTokenAccount);
                walletBalance = tokenAmount.value.uiAmount || 0;
            }
        }

        // Get agent balance if agent mint is provided
        if (aiCharacterMint !== null) {
            // Find the AI character PDA
            const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);

            // Find the associated token account for the AI character
            const agentTokenAccount = anchor.utils.token.associatedAddress({
                mint: computeMint,
                owner: aiCharacter
            });

            // Check if the token account exists
            const agentAccountInfo = await connection.getAccountInfo(agentTokenAccount);
            if (agentAccountInfo) {
                const tokenAmount = await connection.getTokenAccountBalance(agentTokenAccount);
                agentBalance = tokenAmount.value.uiAmount || 0;
            }
        }

        return { walletBalance, agentBalance };
    } catch (error) {
        console.error('Error getting compute balances:', error);
        return { walletBalance: 0, agentBalance: 0 };
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
        const messages = await program.account.messageAiCharacter.all([
            {
                memcmp: {
                    offset: 8 + 32, // Skip the discriminator
                    bytes: aiNftAddress.toBase58(),
                },
            },

        ]);
        console.log("messages: ", messages)
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

export async function fetchAiNfts(
    program: Program<any>,
    connection: Connection
) {
    try {
        const allNfts = await program.account.aiCharacterNft.all();

        // Transform the data to match our AiNft interface
        const formattedNfts = await Promise.all(
            allNfts.map(async (item: any) => {
                try {
                    // Ensure the address is always a string
                    const nftAddress = item.publicKey.toString();

                    // Log for debugging
                    console.log("Processing NFT with address:", nftAddress);

                    // Convert byte arrays to readable strings
                    const name = bytesToString(Array.from(item.account.name)) || 'Unnamed AI';
                    const description = bytesToString(Array.from(item.account.characterConfig?.name)) || 'No description available';

                    return {
                        address: nftAddress,
                        name: name,
                        description: description,
                        imageUrl: 'https://via.placeholder.com/150', // Placeholder until we get the real image
                        dateCreated: new Date(item.account.createdAt?.toNumber() || Date.now()),
                    };
                } catch (err) {
                    console.error('Error processing NFT:', err);
                    // Still return an object with an address even if other data is missing
                    return {
                        address: item.publicKey.toString(),
                        name: 'Error loading NFT',
                        description: 'Error loading NFT data',
                        imageUrl: 'https://via.placeholder.com/150',
                        dateCreated: new Date(),
                    };
                }
            })
        );

        return formattedNfts;
    } catch (error) {
        console.error("Error fetching AI NFTs:", error);
        throw error;
    }
}

// Create AI character compute token account
export const createAiCharacterComputeAccount = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    aiCharacter: PublicKey,
    name: string
) => {
    try {
        if (!wallet.publicKey) {
            throw new Error("Wallet not connected");
        }




        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();
        const [computeMint] = findComputeMintPDA();

        // Get the AI character's compute token account
        const aiCharacterComputeTokenAccount = anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: aiCharacter
        });

        const [aiCharacterMint] = findAiCharacterMintPDA(appAinftPda, name);


        const [aiCharacterMetadata] = findMetadataPDA(aiCharacterMint);

        // Create the instruction
        const instruction = await program.methods
            .createAiCharacterComputeAccount()
            .accounts({
                aiCharacter: aiCharacter,
                computeMint: computeMint,
                aiCharacterComputeTokenAccount: aiCharacterComputeTokenAccount,
                payer: wallet.publicKey,
            })
            .instruction();


        // Get latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash('confirmed');

        // Create a transaction
        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = wallet.publicKey;

        // Sign and send the transaction
        if (!wallet.signTransaction) {
            throw new Error("Wallet does not support signing transactions");
        }
        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());

        // Confirm the transaction
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${confirmation.value.err}`);
        }

        console.log('AI character compute account created:', signature);
        return {
            signature,
            aiCharacterComputeTokenAccount
        };
    } catch (error) {
        console.error('Error creating AI character compute account:', error);
        throw error;
    }
};

// Check if AI character has a compute token account
export const checkAiCharacterComputeAccount = async (
    connection: Connection,
    aiCharacterMint: PublicKey
): Promise<boolean> => {
    try {
        // Find necessary PDAs
        const [computeMint] = findComputeMintPDA();
        const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);

        // Get the associated token address for the AI character's compute token account
        const aiCharacterComputeTokenAccount = anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: aiCharacter
        })


        // Check if the account exists
        const account = await connection.getAccountInfo(aiCharacterComputeTokenAccount);
        return account !== null;
    } catch (error) {
        console.error('Error checking AI character compute account:', error);
        return false;
    }
};

// Update AI character execution client
export async function updateAiCharacterExecutionClient(
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    aiCharacterAddress: PublicKey,
    executionClientAddress: PublicKey
): Promise<{ txId: string }> {
    if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected or missing required capabilities');
    }

    try {
        // Find the app ainft PDA
        const [appAinftPda] = findAppAinftPDA();

        // Get the AI character account to access its mint
        const aiCharacterAccount = await program.account.aiCharacterNft.fetch(aiCharacterAddress);
        const aiCharacterMint = aiCharacterAccount.characterNftMint;

        // Get the token account for the AI character NFT
        const aiCharacterTokenAccount = anchor.utils.token.associatedAddress({
            mint: aiCharacterMint,
            owner: wallet.publicKey
        });

        // Prepare the transaction
        const tx = await program.methods
            .updateAiCharacterExecutionClient()
            .accounts({
                aiNft: appAinftPda,
                aiCharacter: aiCharacterAddress,
                authority: wallet.publicKey,
                aiCharacterMint: aiCharacterMint,
                aiCharacterTokenAccount: aiCharacterTokenAccount,
                executionClient: executionClientAddress,
            })
            .transaction();

        // Sign and send the transaction
        const latestBlockhash = await connection.getLatestBlockhash();
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.feePayer = wallet.publicKey;

        const signedTx = await wallet.signTransaction(tx);
        const txId = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: txId
        });

        return { txId };
    } catch (error) {
        console.error('Error updating AI character execution client:', error);
        throw error;
    }
}

// Transfer compute tokens to an AI character
export const transferComputeTokensToAiCharacter = async (
    connection: Connection,
    wallet: WalletContextState,
    aiCharacterMint: PublicKey,
    amount: number
): Promise<string> => {
    try {
        if (!wallet.publicKey || !wallet.signTransaction) {
            throw new Error('Wallet not connected or missing required capabilities');
        }

        console.log('Transferring compute tokens to AI character:', aiCharacterMint.toString());

        // Find the compute mint PDA
        const [computeMint] = findComputeMintPDA();

        // Find the AI character PDA
        const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);

        // Find the associated token account for the wallet
        const walletTokenAccount = anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: wallet.publicKey
        });

        // Find the associated token account for the AI character
        const aiCharacterTokenAccount = anchor.utils.token.associatedAddress({
            mint: computeMint,
            owner: aiCharacterMint
        });

        // Check if the AI character token account exists
        const accountInfo = await connection.getAccountInfo(aiCharacterTokenAccount);

        // Create token account for AI character if it doesn't exist
        let instructions: web3.TransactionInstruction[] = [];

        if (!accountInfo) {
            console.log('Creating token account for AI character');
            const createATAInstruction = splToken.createAssociatedTokenAccountInstruction(
                wallet.publicKey,  // payer
                aiCharacterTokenAccount, // associatedToken
                aiCharacterMint, // owner
                computeMint // mint
            );
            instructions.push(createATAInstruction);
        }

        // Create transfer instruction
        const transferInstruction = splToken.createTransferInstruction(
            walletTokenAccount, // source
            aiCharacterTokenAccount, // destination
            wallet.publicKey, // owner
            amount * Math.pow(10, 9) // Convert to lamports (9 decimals)
        );

        instructions.push(transferInstruction);

        // Create and sign transaction
        const blockhash = await connection.getLatestBlockhash();
        const transaction = new web3.Transaction().add(...instructions);
        transaction.recentBlockhash = blockhash.blockhash;
        transaction.feePayer = wallet.publicKey;

        const signedTransaction = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signedTransaction.serialize());

        // Wait for confirmation
        await connection.confirmTransaction({
            blockhash: blockhash.blockhash,
            lastValidBlockHeight: blockhash.lastValidBlockHeight,
            signature: txid
        });

        console.log('Compute tokens transferred successfully:', txid);
        return txid;
    } catch (error) {
        console.error('Error transferring compute tokens:', error);
        throw error;
    }
};

export const createAiNftCollection = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    name: string,
    uri: string,
    description: string,
    royaltyBasisPoints: number,
    mintPriceLamports: number,
    startMintDate: number = 0,
    endMintDate: number = 0
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find collection PDA
        const [collection] = findCollectionPDA(wallet.publicKey, name);
        const [collectionMint] = findCollectionMintPDA(collection);
        const [collectionMetadata] = findMetadataPDA(collectionMint);

        // Create the instruction - the symbol is empty string by default in the smart contract
        const ix = await program.methods
            .createAinftCollection(
                name,
                uri,
                description,
                royaltyBasisPoints,
                new BN(mintPriceLamports),
                new BN(startMintDate),
                new BN(endMintDate)
            )
            .accounts({
                collection,
                collectionMint,
                collectionMetadata,
                authority: wallet.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                metadataProgram: METADATA_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${confirmation.value.err.toString()}`);
        }

        console.log('Collection created with transaction:', signature);
        console.log('Collection address:', collection.toString());

        return {
            txId: signature,
            collectionAddress: collection,
        };
    } catch (error) {
        console.error('Error creating collection:', error);
        throw error;
    }
};

export const createCharacterConfig = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    config: {
        name: string;
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
        clients: string[];
    }
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Prepare the config data
        const configId = config.name;

        // Convert string arrays to byte arrays for on-chain storage
        const voiceModel = stringToByteArray(config.settings.voice.model, 32);

        // Transform style config
        const styleAll = Array(5).fill([0]);
        if (config.style && config.style.all) {
            for (let i = 0; i < Math.min(config.style.all.length, 5); i++) {
                styleAll[i] = Array.isArray(config.style.all[i]) ? config.style.all[i] : stringToByteArray(config.style.all[i], 32);
            }
        }

        const styleChat = Array(5).fill([0]);
        if (config.style && config.style.chat) {
            for (let i = 0; i < Math.min(config.style.chat.length, 5); i++) {
                styleChat[i] = Array.isArray(config.style.chat[i]) ? config.style.chat[i] : stringToByteArray(config.style.chat[i], 32);
            }
        }

        const stylePost = Array(5).fill([0]);
        if (config.style && config.style.post) {
            for (let i = 0; i < Math.min(config.style.post.length, 5); i++) {
                stylePost[i] = Array.isArray(config.style.post[i]) ? config.style.post[i] : stringToByteArray(config.style.post[i], 32);
            }
        }

        // Ensure clients array has exactly 5 elements (pad with empty strings)
        const clients = [...config.clients];
        while (clients.length < 5) {
            clients.push('');
        }

        // Create the instruction
        const [characterConfig] = findCharacterConfigPDA(wallet.publicKey, configId);

        const ix = await program.methods
            .createCharacterConfig(configId, {
                name: config.name,
                clients: clients,
                modelProvider: config.modelProvider,
                settings: {
                    voice: {
                        model: voiceModel
                    }
                },
                bio: config.bio,
                lore: config.lore,
                knowledge: config.knowledge,
                topics: config.topics,
                style: {
                    all: styleAll,
                    chat: styleChat,
                    post: stylePost,
                },
                adjectives: config.adjectives
            })
            .accounts({
                characterConfig,
                authority: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${confirmation.value.err.toString()}`);
        }

        console.log('Character config created with transaction:', signature);
        console.log('Character config address:', characterConfig.toString());

        return {
            txId: signature,
            configAddress: characterConfig,
        };
    } catch (error) {
        console.error('Error creating character config:', error);
        throw error;
    }
};

export const premintNft = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    collectionName: string,
    nftName: string,
    nftUri: string,
    price: number,
    characterConfigId?: string
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();
        const [collection] = findCollectionPDA(wallet.publicKey, collectionName);
        const [premintedNftMint] = findPremintedNftMintPDA(collection, nftName);
        const [aiCharacter] = findAiCharacterPDA(premintedNftMint);
        const [nftMetadata] = findMetadataPDA(premintedNftMint);

        // Create collection token account to hold the NFT until purchased
        const collectionTokenAccount = await utils.token.associatedAddress({
            mint: premintedNftMint,
            owner: collection
        });

        // Get character config if provided
        let characterConfig = null;
        if (characterConfigId) {
            const [configPda] = findCharacterConfigPDA(wallet.publicKey, characterConfigId);
            characterConfig = configPda;
        }

        // Create the instruction
        const ix = await program.methods
            .createPremintedNft(
                nftName,
                nftUri,
                collectionName,
                new BN(price),
                null // default execution client
            )
            .accounts({
                aiNft: appAinftPda,
                collection,
                aiCharacter,
                aiCharacterMint: premintedNftMint,
                aiCharacterMetadata: nftMetadata,
                characterConfig: characterConfig,
                collectionTokenAccount,
                authority: wallet.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                metadataProgram: METADATA_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: web3.SYSVAR_RENT_PUBKEY,
                associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${confirmation.value.err.toString()}`);
        }

        console.log('NFT preminted with transaction:', signature);
        console.log('NFT mint address:', premintedNftMint.toString());
        console.log('AI Character address:', aiCharacter.toString());

        return {
            txId: signature,
            nftMintAddress: premintedNftMint,
            aiCharacterAddress: aiCharacter,
        };
    } catch (error) {
        console.error('Error preminting NFT:', error);
        throw error;
    }
};

export const purchasePremintedNft = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    collectionAddress: PublicKey,
    nftMintAddress: PublicKey,
    aiCharacterAddress: PublicKey
) => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();

        // Create buyer's token account to receive the NFT
        const buyerTokenAccount = await utils.token.associatedAddress({
            mint: nftMintAddress,
            owner: wallet.publicKey
        });

        // Get the collection's token account that currently holds the NFT
        const collectionTokenAccount = await utils.token.associatedAddress({
            mint: nftMintAddress,
            owner: collectionAddress
        });

        // Get the collection account to find the authority
        const collectionData = await program.account.ainftCollection.fetch(collectionAddress);

        // Create the instruction
        const ix = await program.methods
            .mintAinftFromCollection()
            .accounts({
                aiNft: appAinftPda,
                aiCharacter: aiCharacterAddress,
                collection: collectionAddress,
                nftMint: nftMintAddress,
                collectionTokenAccount,
                buyerTokenAccount,
                buyer: wallet.publicKey,
                collectionAuthority: collectionData.authority,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${confirmation.value.err.toString()}`);
        }

        console.log('NFT purchased with transaction:', signature);

        return {
            txId: signature,
        };
    } catch (error) {
        console.error('Error purchasing NFT:', error);
        throw error;
    }
};

export const fetchCollections = async (
    program: Program<Ainft>,
    connection: Connection,
    authority?: PublicKey
) => {
    try {
        let collections;

        if (authority) {
            // Fetch collections for a specific authority
            collections = await program.account.ainftCollection.all([
                {
                    memcmp: {
                        offset: 8, // Skip discriminator
                        bytes: authority.toBase58()
                    }
                }
            ]);
        } else {
            // Fetch all collections
            collections = await program.account.ainftCollection.all();
        }

        return collections.map(collection => ({
            publicKey: collection.publicKey,
            authority: collection.account.authority,
            name: collection.account.name,
            // Use a default empty symbol if not present or convert to string if it's a byte array
            symbol: typeof collection.account.symbol === 'string'
                ? collection.account.symbol
                : collection.account.symbol
                    ? String.fromCharCode(...collection.account.symbol.filter(b => b !== 0))
                    : '',
            uri: collection.account.uri,
            mint: collection.account.mint,
            description: collection.account.description || '',
            royaltyBasisPoints: collection.account.royaltyBasisPoints,
            mintPrice: collection.account.mintPrice,
            mintCount: collection.account.mintCount,
            startMintDate: collection.account.startMintDate,
            endMintDate: collection.account.endMintDate,
            premintingFinalized: collection.account.premintingFinalized,
            totalSupply: collection.account.totalSupply || collection.account.maxSupply,
            bump: collection.account.bump,
        }));
    } catch (error) {
        console.error('Error fetching collections:', error);
        return [];
    }
};

export const fetchPremintedNfts = async (
    program: Program<Ainft>,
    connection: Connection,
    collectionAddress: PublicKey
) => {
    try {
        // Fetch all AI characters
        const aiCharacters = await program.account.aiCharacterNft.all();
        console.log('Fetched all AI characters:', aiCharacters.length);

        // The problem is that the collection address is not directly stored in the aiCharacterNft account
        // We need to check each NFT manually to see if it belongs to this collection
        const collection = await program.account.ainftCollection.fetch(collectionAddress);
        console.log('Collection found:', collection.name);

        // Filter for preminted NFTs that belong to this collection
        const premintedNfts = aiCharacters.filter(character => {
            // Check the token account - if it's owned by this collection, it's part of this collection
            const tokenAccount = character.account.tokenAccount;
            return (
                // For a preminted NFT, the token account should be owned by the collection
                tokenAccount &&
                tokenAccount.equals(collectionAddress) ||
                // Also include minted NFTs that were originally from this collection
                character.account.isPreminted
            );
        });

        console.log('Filtered preminted NFTs for collection:', premintedNfts.length);

        return premintedNfts.map(nft => ({
            publicKey: nft.publicKey,
            aiNft: nft.account.appAiNftMint, // Note: field name in the account is appAiNftMint
            mint: nft.account.characterNftMint, // Note: field name in the account is characterNftMint
            name: typeof nft.account.name === 'string'
                ? nft.account.name
                : String.fromCharCode(...nft.account.name.filter(b => b !== 0)),
            executionClient: nft.account.executionClient,
            tokenAccount: nft.account.tokenAccount || PublicKey.default,
            computeTokenAccount: nft.account.computeTokenAccount,
            characterConfig: nft.account.characterConfigPubkey, // Note: field name is characterConfigPubkey
            isPreminted: nft.account.isPreminted,
            isMinted: nft.account.isMinted,
            messageCount: typeof nft.account.messageCount === 'number'
                ? nft.account.messageCount
                : nft.account.messageCount.toNumber(),
            bump: nft.account.bump,
        }));
    } catch (error) {
        console.error('Error fetching preminted NFTs:', error);
        return [];
    }
};

export const setExternalComputeMint = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    externalComputeMint: PublicKey
): Promise<{ txId: string }> => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [appAinftPda] = findAppAinftPDA();

        // Create the instruction
        const ix = await program.methods
            .setExternalComputeMint()
            .accounts({
                aiNft: appAinftPda,
                externalComputeMint: externalComputeMint,
                authority: wallet.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        console.log('External compute mint set with transaction:', signature);

        return {
            txId: signature,
        };
    } catch (error) {
        console.error('Error setting external compute mint:', error);
        throw error;
    }
};

export const fetchCharacterConfigs = async (
    program: Program<Ainft>,
    connection: Connection,
    authority?: PublicKey
) => {
    try {
        let configs;

        if (authority) {
            // Fetch configs for a specific authority
            configs = await program.account.characterConfig.all([
                {
                    memcmp: {
                        offset: 8, // Skip discriminator
                        bytes: authority.toBase58()
                    }
                }
            ]);
        } else {
            // Fetch all configs
            configs = await program.account.characterConfig.all();
        }

        return configs.map(config => {
            // Helper function to convert byte array to string
            const byteArrayToString = (byteArray) => {
                return String.fromCharCode(...byteArray.filter(b => b !== 0));
            };

            // Process string arrays
            const processStringArray = (byteArrays) => {
                return byteArrays
                    .map(byteArray => byteArrayToString(byteArray))
                    .filter(str => str.length > 0);
            };

            return {
                publicKey: config.publicKey,
                name: byteArrayToString(config.account.name),
                clients: processStringArray(config.account.clients),
                modelProvider: byteArrayToString(config.account.modelProvider),
                settings: {
                    voice: {
                        model: byteArrayToString(config.account.settings.voice.model)
                    }
                },
                bio: processStringArray(config.account.bio),
                lore: processStringArray(config.account.lore),
                knowledge: processStringArray(config.account.knowledge),
                topics: processStringArray(config.account.topics),
                style: {
                    all: config.account.style.all.map(byteArrayToString).filter(str => str.length > 0),
                    chat: config.account.style.chat.map(byteArrayToString).filter(str => str.length > 0),
                    post: config.account.style.post.map(byteArrayToString).filter(str => str.length > 0),
                },
                adjectives: processStringArray(config.account.adjectives),
                authority: config.account.authority,
                bump: config.account.bump,
            };
        });
    } catch (error) {
        console.error('Error fetching character configs:', error);
        return [];
    }
};

export const finalizePreminting = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    collectionName: string
): Promise<{ txId: string }> => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [collection] = findCollectionPDA(wallet.publicKey, collectionName);

        // Create the instruction
        const ix = await program.methods
            .finalizePreminting(collectionName)
            .accounts({
                collection,
                authority: wallet.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());

        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        console.log('Preminting finalized with transaction:', signature);

        return {
            txId: signature
        };
    } catch (error) {
        console.error('Error finalizing preminting:', error);
        throw error;
    }
};

export const updateCollection = async (
    program: Program<Ainft>,
    wallet: WalletContextState,
    connection: Connection,
    collectionName: string,
    updates: {
        newName?: string;
        newUri?: string;
        newDescription?: string;
        newMintPrice?: number;
        newStartMintDate?: number;
        newEndMintDate?: number;
    }
): Promise<{ txId: string }> => {
    if (!program) throw new Error('Program not initialized');
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

    try {
        // Find necessary PDAs
        const [collection] = findCollectionPDA(wallet.publicKey, collectionName);
        console.log('Update collection', collection);
        console.log('Update collection name', updates.newName);
        console.log('Update collection uri', updates.newUri);
        console.log('Update collection description', updates.newDescription);
        console.log('Update collection mint price', updates.newMintPrice);
        console.log('Update collection start mint date', updates.newStartMintDate);
        console.log('Update collection end mint date', updates.newEndMintDate);
        // Create the instruction
        const ix = await program.methods
            .updateCollection(
                collectionName,
                updates.newName ? updates.newName : null,
                updates.newUri ? updates.newUri : null,
                updates.newDescription ? updates.newDescription : null,
                updates.newMintPrice ? new BN(updates.newMintPrice) : null,
                updates.newStartMintDate ? new BN(updates.newStartMintDate) : null,
                updates.newEndMintDate ? new BN(updates.newEndMintDate) : null
            )
            .accounts({
                collection,
                authority: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create a versioned transaction
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
            instructions: [ix]
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send and confirm transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        console.log('Collection updated with transaction:', signature);

        return {
            txId: signature
        };
    } catch (error) {
        console.error('Error updating collection:', error);
        throw error;
    }
};