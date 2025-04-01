'use client';

import * as spl from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { programs } from "@metaplex/js";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
    useAnchorProgram,
    updateCharacterConfig,
    checkAiCharacterComputeAccount,
    createAiCharacterComputeAccount,
    fetchAllExecutionClients,
    updateAiCharacterExecutionClient,
    getAiCharacterComputeTokenBalance
} from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import { bytesToString, bytesArrayToStrings } from '../utils/metadata';
import PageLayout from '../components/PageLayout';
import CopyableAddress from '../components/CopyableAddress';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import Link from 'next/link';
import { Edit, MessageSquare, ExternalLink, Coins, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '../components/ui/toast';

// AI NFT interface
interface AiNft {
    address: string;
    name: string;
    description: string;
    imageUrl: string;
    dateCreated: Date;
    hasComputeAccount?: boolean;
    executionClient?: string;
    computeTokenBalance?: number;
}

// Execution client interface
interface ExecutionClientData {
    publicKey: PublicKey;
    aiNft: PublicKey;
    authority: PublicKey;
    computeTokenAddress: PublicKey;
    gas: number;
    computeMint: PublicKey;
    liquidStakingTokenMint: PublicKey;
    stakePoolTokenAccount: PublicKey;
    totalCompute: number;
    totalStaked: number;
    totalProcessed: number;
    stakerFeeShare: number;
    active: boolean;
    supportedMessageTypes: string[];
}

export default function ManagePage() {
    const { publicKey } = useWallet();
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { addToast } = useToast();

    // AI NFTs state
    const [aiNfts, setAiNfts] = useState<AiNft[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creatingComputeAccount, setCreatingComputeAccount] = useState<{ [key: string]: boolean }>({});

    // Execution client state
    const [executionClients, setExecutionClients] = useState<ExecutionClientData[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [updatingExecutionClient, setUpdatingExecutionClient] = useState<{ [key: string]: boolean }>({});

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load execution clients
    useEffect(() => {
        if (!isClient || !program || !connection) return;

        const fetchClients = async () => {
            try {
                setLoadingClients(true);
                const clients = await fetchAllExecutionClients(program, connection);
                setExecutionClients(clients);
            } catch (err) {
                console.error('Error fetching execution clients:', err);
            } finally {
                setLoadingClients(false);
            }
        };

        fetchClients();
    }, [isClient, program, connection]);

    // Load AI NFTs when wallet is connected
    useEffect(() => {
        if (!isClient || !publicKey || !program || !connection) return;

        const fetchAiNfts = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all AI Character NFTs from the program
                const allNfts = await program.account.aiCharacterNft.all();

                // Filter NFTs by the current wallet's public key
                const userNfts = allNfts.filter(async item => {
                    const mint = item.account.characterNftMint.toString();
                    // get mint metadata
                    const mintMetadata = await connection?.getAccountInfo(new PublicKey(mint));
                    console.log("mintMetadata", mintMetadata);
                    return mintMetadata?.owner.toString() === publicKey?.toString()
                });
                const { metadata: { Metadata } } = programs;


                // Transform the data to match our AiNft interface
                const formattedNfts: AiNft[] = await Promise.all(userNfts.map(async item => {
                    const metadataPDA = await Metadata.getPDA(item.account.characterNftMint);
                    const tokenMetadata = await Metadata.load(connection, metadataPDA);
                    console.log("tokenMetadata", tokenMetadata);
                    console.log("item", item.publicKey.toString());

                    // Convert byte arrays to readable strings
                    const name = bytesToString(Array.from(item.account.name)) || 'Unnamed AI';
                    const description = bytesToString(Array.from(item.account.characterConfig.name)) || 'No description available';

                    // Check if the AI character has a compute token account
                    const hasComputeAccount = await checkAiCharacterComputeAccount(
                        connection,
                        item.account.characterNftMint
                    );

                    // Get the execution client if set
                    const executionClient = item.account.executionClient ?
                        item.account.executionClient.toString() :
                        undefined;

                    // Get compute token balance if the character has a compute account
                    let computeTokenBalance = 0;
                    if (hasComputeAccount) {
                        computeTokenBalance = await getAiCharacterComputeTokenBalance(
                            connection,
                            item.account.characterNftMint
                        );
                    }

                    return {
                        address: item.publicKey.toString(),
                        name: name,
                        description: description,
                        imageUrl: tokenMetadata.data.data.uri || '/placeholder-image.png',
                        dateCreated: new Date((item.account as any).createdAt?.toNumber() || Date.now()),
                        hasComputeAccount,
                        executionClient,
                        computeTokenBalance
                    }
                }));

                setAiNfts(formattedNfts);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching AI NFTs:', err);
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                setLoading(false);
            }
        };

        fetchAiNfts();
    }, [isClient, publicKey, program, connection]);

    // Add this to your component to log NFT data
    useEffect(() => {
        console.log("NFTs data:", aiNfts);
    }, [aiNfts]);

    // Function to create compute token account for an AI character
    const handleCreateComputeAccount = async (nft: AiNft) => {
        if (!program || !wallet.publicKey || !connection || !wallet.signTransaction) {
            addToast('Wallet not connected or missing required capabilities', 'error');
            return;
        }

        try {
            // Set loading state for this specific NFT
            setCreatingComputeAccount(prev => ({ ...prev, [nft.address]: true }));

            // Create the compute token account
            const result = await createAiCharacterComputeAccount(
                program,
                wallet,
                connection,
                new PublicKey(nft.address),
                nft.name
            );

            // Update the NFT in the state to show it now has a compute account
            setAiNfts(prev =>
                prev.map(item =>
                    item.address === nft.address
                        ? { ...item, hasComputeAccount: true }
                        : item
                )
            );

            addToast('Compute token account created successfully!', 'success');
        } catch (error) {
            console.error('Error creating compute token account:', error);
            addToast(`Failed to create compute token account: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            // Clear loading state for this specific NFT
            setCreatingComputeAccount(prev => ({ ...prev, [nft.address]: false }));
        }
    };

    // Function to update execution client for an AI character
    const handleUpdateExecutionClient = async (nft: AiNft, client: ExecutionClientData) => {
        if (!program || !wallet.publicKey || !connection || !wallet.signTransaction) {
            addToast('Wallet not connected or missing required capabilities', 'error');
            return;
        }

        try {
            // Set loading state for this specific NFT
            setUpdatingExecutionClient(prev => ({ ...prev, [nft.address]: true }));

            // Update the execution client
            const result = await updateAiCharacterExecutionClient(
                program,
                wallet,
                connection,
                new PublicKey(nft.address),
                client.publicKey
            );

            // Update the NFT in the state to show the updated execution client
            setAiNfts(prev =>
                prev.map(item =>
                    item.address === nft.address
                        ? { ...item, executionClient: client.publicKey.toString() }
                        : item
                )
            );

            addToast('Execution client updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating execution client:', error);
            addToast(`Failed to update execution client: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            // Clear loading state for this specific NFT
            setUpdatingExecutionClient(prev => ({ ...prev, [nft.address]: false }));
        }
    };

    // Only render wallet-dependent content on the client
    if (!isClient) {
        return (
            <PageLayout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Manage Your AI NFTs</h1>
                    <p>Loading wallet connection...</p>
                </div>
            </PageLayout>
        );
    }

    const handleEditClick = (nft: AiNft) => {
        console.log("Edit clicked for NFT:", nft);
        console.log("NFT address:", nft?.address);

        if (nft && nft.address) {
            router.push(`/edit?address=${nft.address}`);
        } else {
            console.error("Cannot edit NFT: address is undefined", nft);
        }
    };

    return (
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Manage Your AI NFTs</h1>
                        <Link
                            href="/mint"
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                        >
                            Create New AI NFT
                        </Link>
                    </div>

                    {!publicKey ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Connect your wallet to manage your AI NFTs</p>
                            <p>Please use the wallet button in the header to connect.</p>
                        </div>
                    ) : programLoading ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Loading program...</p>
                            <div className="animate-pulse h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                            <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ) : programError ? (
                        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Error loading program</p>
                            <p>{programError.message}</p>
                        </div>
                    ) : loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                                    <div className="h-48 bg-gray-700"></div>
                                    <div className="p-4">
                                        <div className="h-6 bg-gray-700 rounded mb-3 w-3/4"></div>
                                        <div className="h-4 bg-gray-700 rounded mb-2 w-full"></div>
                                        <div className="h-4 bg-gray-700 rounded mb-2 w-5/6"></div>
                                        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                                        <div className="mt-4 flex justify-between">
                                            <div className="h-8 bg-gray-700 rounded w-24"></div>
                                            <div className="h-8 bg-gray-700 rounded w-24"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Error fetching AI NFTs</p>
                            <p>{error}</p>
                        </div>
                    ) : aiNfts.length === 0 ? (
                        <div className="bg-gray-800 p-6 rounded-lg text-center">
                            <p className="text-xl mb-4">You don't have any AI NFTs yet</p>
                            <p className="mb-6">Create your first AI NFT to get started!</p>
                            <Link
                                href="/mint"
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                            >
                                Create AI NFT
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {aiNfts.map((nft) => (
                                <motion.div
                                    key={nft.address}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all"
                                >
                                    <div className="h-48 bg-gray-700 relative">
                                        <img
                                            src={nft.imageUrl}
                                            alt={nft.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
                                        <div className="absolute bottom-0 left-0 p-4">
                                            <h3 className="text-xl font-bold">{nft.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-gray-300 mb-4">{nft.description}</p>
                                        <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                                            <span>Created: {nft.dateCreated?.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}</span>
                                            <a
                                                href={`https://explorer.solana.com/address/${nft.address}?cluster=${network}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-blue-400 hover:underline"
                                            >
                                                View <ExternalLink size={14} className="ml-1" />
                                            </a>
                                        </div>

                                        {/* Compute Account Status */}
                                        <div className="mb-4 p-2 rounded bg-gray-700/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300 flex items-center">
                                                    <Coins size={16} className="mr-2" />
                                                    Compute Account:
                                                </span>
                                                {nft.hasComputeAccount ? (
                                                    <span className="text-sm text-green-400 font-medium">Active</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateComputeAccount(nft)}
                                                        disabled={creatingComputeAccount[nft.address]}
                                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {creatingComputeAccount[nft.address] ? 'Creating...' : 'Create Account'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Compute Token Balance (only shown if compute account exists) */}
                                            {nft.hasComputeAccount && (
                                                <div className="mt-2 flex justify-between items-center">
                                                    <span className="text-sm text-gray-300">Token Balance:</span>
                                                    <span className={cn(
                                                        "text-sm font-medium px-2 py-1 rounded",
                                                        (nft.computeTokenBalance !== undefined && nft.computeTokenBalance < 5)
                                                            ? "bg-red-900/70 text-red-200"
                                                            : "text-blue-400"
                                                    )}>
                                                        {nft.computeTokenBalance !== undefined ? `${nft.computeTokenBalance} tokens` : 'Loading...'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Execution Client Status */}
                                        <div className="mb-4 p-2 rounded bg-gray-700/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300 flex items-center">
                                                    <Server size={16} className="mr-2" />
                                                    Execution Client:
                                                </span>
                                                {nft.executionClient ? (
                                                    <div className="flex items-center">
                                                        <CopyableAddress address={nft.executionClient} />
                                                        <button
                                                            onClick={() => setAiNfts(prev =>
                                                                prev.map(item =>
                                                                    item.address === nft.address
                                                                        ? { ...item, executionClient: undefined }
                                                                        : item
                                                                )
                                                            )}
                                                            className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
                                                        >
                                                            Change
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col w-full space-y-2">
                                                        <select
                                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                                                            value={nft.executionClient || ''}
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    const selectedClient = executionClients.find(
                                                                        (client) => client.publicKey.toString() === e.target.value
                                                                    );
                                                                    
                                                                    if (selectedClient) {
                                                                        // First update local state to show selection immediately
                                                                        setAiNfts(prev =>
                                                                            prev.map(item =>
                                                                                item.address === nft.address
                                                                                    ? { ...item, executionClient: e.target.value }
                                                                                    : item
                                                                            )
                                                                        );
                                                                        
                                                                        // Then update on blockchain
                                                                        handleUpdateExecutionClient(nft, selectedClient);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Select Execution Client</option>
                                                            {executionClients.map((client) => (
                                                                <option 
                                                                    key={client.publicKey.toString()} 
                                                                    value={client.publicKey.toString()}
                                                                >
                                                                    {client.publicKey.toString().substring(0, 4)}...{client.publicKey.toString().substring(client.publicKey.toString().length - 4)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {updatingExecutionClient[nft.address] && (
                                                            <div className="text-center">
                                                                <span className="text-xs text-blue-400">Updating execution client...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/chat?address=${nft.address}`}
                                                className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                                            >
                                                <MessageSquare size={16} className="mr-2" />
                                                Chat
                                            </Link>
                                            <Link
                                                href={nft?.address ? `/edit?address=${nft.address}` : '#'}
                                                onClick={(e) => {
                                                    if (!nft?.address) {
                                                        e.preventDefault();
                                                        console.error("Cannot edit NFT: address is undefined", nft);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
                                            >
                                                <Edit size={16} className="mr-2" />
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </PageLayout>
    );
}