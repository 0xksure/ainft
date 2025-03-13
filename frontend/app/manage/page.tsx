'use client';

import * as spl from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { programs } from "@metaplex/js";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorProgram, updateCharacterConfig } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import Link from 'next/link';
import { Edit, MessageSquare, ExternalLink } from 'lucide-react';

// AI NFT interface
interface AiNft {
    address: string;
    name: string;
    description: string;
    imageUrl: string;
    dateCreated: Date;
}

export default function ManagePage() {
    const { publicKey } = useWallet();
    const { network, connection } = useNetworkStore();
    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // AI NFTs state
    const [aiNfts, setAiNfts] = useState<AiNft[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load AI NFTs when wallet is connected
    useEffect(() => {
        if (!isClient || !publicKey || !program) return;

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
                const formattedNfts: AiNft[] = userNfts.map(async item => {
                    const metadataPDA = await Metadata.getPDA(item.account.characterNftMint);
                    const tokenMetadata = await Metadata.load(connection, metadataPDA);
                    console.log("tokenMetadata", tokenMetadata);
                    return {
                        address: item.publicKey.toString(),
                        name: item.account.name || 'Unnamed AI',
                        description: item.account.characterConfig.name.toString() || 'No description available',
                        imageUrl: tokenMetadata.data.data.uri,
                        dateCreated: new Date(item.account.createdAt?.toNumber() || Date.now()),
                    }
                });

                setAiNfts(formattedNfts);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching AI NFTs:', err);
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                setLoading(false);
            }
        };

        fetchAiNfts();
    }, [isClient, publicKey, program]);

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
                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/chat?address=${nft.address}`}
                                                className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                                            >
                                                <MessageSquare size={16} className="mr-2" />
                                                Chat
                                            </Link>
                                            <Link
                                                href={`/edit?address=${nft.address}`}
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