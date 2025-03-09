import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { useNetworkStore } from '../stores/networkStore';
import { Program as ProjectSerumProgram, Wallet, web3 } from '@project-serum/anchor';

// Define our own IDL interface without extending Idl
export interface AiNftIDL {
    version: string;
    name: string;
    instructions: any[];
    accounts: any[];
    types: any[];
}

// Define the network types
export type Network = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

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
        default:
            return 'https://api.devnet.solana.com';
    }
};

// Program ID for the AiNFT program - using a dummy but valid base58 PublicKey
export const AINFT_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

// Hook to get the Anchor program
export const useAnchorProgram = () => {
    const wallet = useAnchorWallet();
    const { network, connection } = useNetworkStore();
    // Use any type to avoid TypeScript errors with the IDL
    const [program, setProgram] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Set mounted state on client-side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Skip during SSR
        if (!isBrowser || !isMounted) return;

        // Skip if no connection
        if (!connection) return;

        // If wallet is not connected, we can still initialize a connection
        // but we won't be able to sign transactions
        try {
            if (wallet) {
                // Use the connection from the network store with a connected wallet
                const provider = new AnchorProvider(connection, wallet, {
                    preflightCommitment: 'confirmed',
                });

                console.log('Would initialize program with ID:', AINFT_PROGRAM_ID.toString());
                console.log('Using network:', network);
                console.log('Wallet connected:', wallet.publicKey.toString());
            } else {
                // For read-only operations, we can still use the connection
                console.log('Would initialize program with ID:', AINFT_PROGRAM_ID.toString());
                console.log('Using network:', network);
                console.log('No wallet connected, read-only mode');
            }
        } catch (error) {
            console.error('Error initializing program:', error);
        }
    }, [wallet, connection, network, isMounted]);

    return program;
};

// Interface for character config based on the Rust program
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

// Function to create an AI NFT
export const createAiNft = async (
    program: any,
    wallet: PublicKey,
    config: CharacterConfig
) => {
    try {
        // This would be the actual implementation
        // const tx = await program.methods
        //   .createAppAinft(config)
        //   .accounts({
        //     payer: wallet,
        //     // other accounts...
        //   })
        //   .rpc();

        console.log('Would create AI NFT with config:', config);
        return 'transaction_id_placeholder';
    } catch (error) {
        console.error('Error creating AI NFT:', error);
        throw error;
    }
};

// Function to mint an AI NFT
export const mintAiNft = async (
    program: any,
    wallet: PublicKey,
    name: string,
    uri: string
) => {
    try {
        // This would be the actual implementation
        // const tx = await program.methods
        //   .mintAinft(name, uri)
        //   .accounts({
        //     payer: wallet,
        //     // other accounts...
        //   })
        //   .rpc();

        console.log('Would mint AI NFT with name:', name, 'and URI:', uri);
        return 'transaction_id_placeholder';
    } catch (error) {
        console.error('Error minting AI NFT:', error);
        throw error;
    }
};

// Function to send a message to an AI NFT
export const sendMessage = async (
    program: any,
    wallet: PublicKey,
    aiNftAddress: PublicKey,
    content: string
) => {
    try {
        // This would be the actual implementation
        // const tx = await program.methods
        //   .sendMessage(content)
        //   .accounts({
        //     sender: wallet,
        //     aiNft: aiNftAddress,
        //     // other accounts...
        //   })
        //   .rpc();

        console.log('Would send message to AI NFT:', aiNftAddress.toString(), 'with content:', content);
        return 'transaction_id_placeholder';
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Function to register an execution client
export const registerExecutionClient = async (
    program: any,
    wallet: PublicKey,
    gas: number,
    supportedMessageTypes: string[],
    stakerFeeShare: number
) => {
    try {
        // This would be the actual implementation
        // const tx = await program.methods
        //   .registerExecutionClient(
        //     gas,
        //     supportedMessageTypes,
        //     stakerFeeShare,
        //     0 // execution_client_bump
        //   )
        //   .accounts({
        //     payer: wallet,
        //     // other accounts...
        //   })
        //   .rpc();

        console.log('Would register execution client with gas:', gas);
        return 'transaction_id_placeholder';
    } catch (error) {
        console.error('Error registering execution client:', error);
        throw error;
    }
};

// More functions can be added as needed based on the Rust program 