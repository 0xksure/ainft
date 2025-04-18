'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import {
    useAnchorProgram,
    fetchCollections,
    fetchPremintedNfts,
    purchasePremintedNft
} from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { getExplorerUrl, getExplorerName } from '../utils/explorer';

export default function BrowseNftsPage() {
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const router = useRouter();

    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // Collections state
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [premintedNfts, setPremintedNfts] = useState<any[]>([]);

    // Transaction state
    const [isLoading, setIsLoading] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchasingNft, setPurchasingNft] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [purchasedNftMint, setPurchasedNftMint] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Image error state
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    // Add state for countdown timers
    const [countdowns, setCountdowns] = useState<Record<string, string>>({});

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load collections when program is ready
    useEffect(() => {
        if (program && connection) {
            loadCollections();
        }
    }, [program, connection]);

    // Load preminted NFTs when a collection is selected
    useEffect(() => {
        if (program && connection && selectedCollection) {
            loadPremintedNfts();
        }
    }, [program, connection, selectedCollection]);

    // Add useEffect for countdown timers
    useEffect(() => {
        if (!collections.length) return;

        // Initialize countdowns object
        const initialCountdowns: Record<string, string> = {};

        // Set up the countdown timer
        const intervalId = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);

            // Update countdowns for all collections with future start dates
            const updatedCountdowns: Record<string, string> = {};

            collections.forEach(collection => {
                if (collection.start_mint_date && collection.start_mint_date > now) {
                    const timeRemaining = collection.start_mint_date - now;
                    updatedCountdowns[collection.publicKey.toString()] = formatTimeRemaining(timeRemaining);
                }
            });

            setCountdowns(updatedCountdowns);
        }, 1000);

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, [collections]);

    // Load all collections
    const loadCollections = async () => {
        if (!program || !connection) return;

        setIsLoading(true);
        try {
            // Load all collections from all creators
            const allCollections = await fetchCollections(program, connection);
            setCollections(allCollections);
        } catch (err) {
            console.error('Error loading collections:', err);
            setError('Failed to load collections. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load preminted NFTs for a selected collection
    const loadPremintedNfts = async () => {
        if (!program || !connection || !selectedCollection) return;

        setIsLoading(true);
        setPremintedNfts([]);
        try {
            // Load preminted NFTs for the selected collection
            const preminted = await fetchPremintedNfts(
                program,
                connection,
                new PublicKey(selectedCollection)
            );
            setPremintedNfts(preminted);
        } catch (err) {
            console.error('Error loading preminted NFTs:', err);
            setError('Failed to load preminted NFTs. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle collection selection
    const handleCollectionSelect = (collectionPublicKey: string) => {
        setSelectedCollection(collectionPublicKey);
        // Reset any previous purchase state
        setTxHash(null);
        setPurchasedNftMint(null);
        setError(null);
    };

    // Handle NFT purchase
    const handlePurchaseNft = async (nft: any) => {
        if (!program || !wallet.publicKey || !connection || !selectedCollection) {
            setError("Program, wallet, or collection not available");
            return;
        }

        setIsPurchasing(true);
        setPurchasingNft(nft.mint.toString());
        setError(null);

        try {
            // Purchase the preminted NFT
            const result = await purchasePremintedNft(
                program,
                wallet,
                connection,
                new PublicKey(selectedCollection),
                nft.mint,
                nft.publicKey
            );

            setTxHash(result.txId);
            setPurchasedNftMint(nft.mint.toString());

            // Refresh the list after a purchase
            await loadPremintedNfts();
        } catch (err) {
            console.error('Error purchasing NFT:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsPurchasing(false);
            setPurchasingNft(null);
        }
    };

    // Handle image error
    const handleImageError = (nftMint: string) => {
        setImageErrors(prev => ({ ...prev, [nftMint]: true }));
    };

    // Add helper functions for displaying dates and status
    const formatDate = (timestamp: number) => {
        if (!timestamp || timestamp <= 0) return null;
        return new Date(timestamp * 1000).toLocaleString();
    };

    const getMintStatus = (collection: any) => {
        if (!collection.preminting_finalized) {
            return { status: 'unavailable', label: 'Not Available', color: 'bg-red-600' };
        }

        const now = Math.floor(Date.now() / 1000);

        // Check if mint has started
        if (collection.start_mint_date && collection.start_mint_date > 0 && now < collection.start_mint_date) {
            return { status: 'upcoming', label: 'Upcoming', color: 'bg-yellow-600' };
        }

        // Check if mint has ended
        if (collection.end_mint_date && collection.end_mint_date > 0 && now > collection.end_mint_date) {
            return { status: 'ended', label: 'Ended', color: 'bg-gray-600' };
        }

        return { status: 'active', label: 'Active', color: 'bg-green-600' };
    };

    // Format time remaining in human-readable format
    const formatTimeRemaining = (seconds: number): string => {
        if (seconds <= 0) return "Now";

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    // Only render wallet-dependent content on the client
    if (!isClient) {
        return (
            <PageLayout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Browse AI NFTs</h1>
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
                    <h1 className="text-3xl font-bold mb-6">Browse AI NFTs</h1>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                            <h2 className="text-2xl font-semibold mb-4">Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Success message */}
                    {txHash && purchasedNftMint && (
                        <div className="bg-green-900/50 border border-green-700 p-6 rounded-lg mb-8">
                            <h2 className="text-2xl font-semibold mb-4">NFT Purchased Successfully!</h2>
                            <p className="mb-2">You have successfully purchased an AI NFT on the {network} network.</p>
                            <p className="mb-4">
                                <span className="font-semibold">NFT Mint Address:</span>{' '}
                                <code className="bg-black/30 px-2 py-1 rounded break-all">{purchasedNftMint}</code>
                            </p>
                            <p>
                                <span className="font-semibold">Transaction:</span>{' '}
                                <a
                                    href={getExplorerUrl('tx', txHash, network)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    View on {getExplorerName(network)} Explorer
                                </a>
                            </p>
                            <div className="mt-4 flex gap-4">
                                <Link
                                    href="/my-nfts"
                                    className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                                >
                                    View My NFTs
                                </Link>
                                <Link
                                    href="/chat"
                                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                >
                                    Chat with Your AI
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        {/* Loading state */}
                        {(programLoading || isLoading) && !selectedCollection && (
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Loading Collections...</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
                                            <div className="w-full h-48 bg-gray-600 rounded-lg mb-4"></div>
                                            <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Collections grid */}
                        {!selectedCollection && collections.length > 0 && (
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Collections</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {collections.map((collection) => {
                                        const mintStatus = getMintStatus(collection);
                                        const collectionKey = collection.publicKey.toString();
                                        const countdown = countdowns[collectionKey];

                                        return (
                                            <motion.div
                                                key={collectionKey}
                                                whileHover={{ scale: 1.02 }}
                                                className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer border border-gray-600"
                                                onClick={() => handleCollectionSelect(collectionKey)}
                                            >
                                                <div className="aspect-video relative bg-gray-600">
                                                    {collection.uri && (
                                                        <Image
                                                            src={collection.uri}
                                                            alt={collection.name}
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                            onError={() => { }}
                                                        />
                                                    )}
                                                    <div className="absolute top-2 right-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-white ${mintStatus.color}`}>
                                                            {mintStatus.label}
                                                        </span>
                                                    </div>

                                                    {/* Countdown overlay for upcoming mints */}
                                                    {mintStatus.status === 'upcoming' && countdown && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 flex items-center justify-center">
                                                            <div className="flex items-center text-xs font-medium">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="text-yellow-400">Starts in: </span>
                                                                <span className="ml-1 text-white">{countdown}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    <h3 className="text-xl font-bold mb-1">{collection.name}</h3>
                                                    <p className="text-gray-400 mb-2">{collection.symbol}</p>
                                                    <div className="flex justify-between">
                                                        <span>
                                                            {collection.mintCount ? collection.mintCount.toString() : '0'}/
                                                            {collection.totalSupply ? collection.totalSupply.toString() : 'Unlimited'} Minted
                                                        </span>
                                                        <span>
                                                            {collection.mintPrice ? (collection.mintPrice.toString() / 1_000_000_000) : '0'} SOL
                                                        </span>
                                                    </div>

                                                    {/* Show mint dates if available */}
                                                    {(collection.start_mint_date > 0 || collection.end_mint_date > 0) && (
                                                        <div className="mt-3 text-sm border-t border-gray-600 pt-2">
                                                            {collection.start_mint_date > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Start:</span>
                                                                    <span>{formatDate(collection.start_mint_date)}</span>
                                                                </div>
                                                            )}
                                                            {collection.end_mint_date > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">End:</span>
                                                                    <span>{formatDate(collection.end_mint_date)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No collections message */}
                        {!selectedCollection && !isLoading && collections.length === 0 && (
                            <div className="bg-gray-800 p-6 rounded-lg text-center">
                                <h2 className="text-2xl font-semibold mb-4">No Collections Found</h2>
                                <p className="mb-4">There are no AI NFT collections available yet.</p>
                            </div>
                        )}

                        {/* Selected Collection */}
                        {selectedCollection && (
                            <div className="space-y-6">
                                {/* Collection header */}
                                <div className="bg-gray-800 p-6 rounded-lg">
                                    {(() => {
                                        const collection = collections.find(c => c.publicKey.toString() === selectedCollection);
                                        if (!collection) return <p>Collection details not found</p>;

                                        const mintStatus = getMintStatus(collection);
                                        const countdown = countdowns[selectedCollection];

                                        return (
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h2 className="text-2xl font-semibold">{collection.name}</h2>
                                                        <span className={`px-2 py-1 rounded-full text-xs text-white ${mintStatus.color}`}>
                                                            {mintStatus.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400">
                                                        {collection.mintCount ? collection.mintCount.toString() : '0'}/
                                                        {collection.totalSupply ? collection.totalSupply.toString() : 'Unlimited'} Minted •
                                                        Base Price: {collection.mintPrice ? (collection.mintPrice.toString() / 1_000_000_000) : '0'} SOL
                                                    </p>

                                                    {/* Show mint countdown in detail view */}
                                                    {mintStatus.status === 'upcoming' && countdown && (
                                                        <div className="mt-2 bg-yellow-900/30 text-yellow-400 px-3 py-1.5 rounded-md inline-flex items-center text-sm">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            Mint starts in: <span className="font-semibold ml-1">{countdown}</span>
                                                        </div>
                                                    )}

                                                    {/* Show mint dates if available */}
                                                    {(collection.start_mint_date > 0 || collection.end_mint_date > 0) && (
                                                        <div className="mt-2 text-sm text-gray-400">
                                                            {collection.start_mint_date > 0 && (
                                                                <span className="mr-4">Start: {formatDate(collection.start_mint_date)}</span>
                                                            )}
                                                            {collection.end_mint_date > 0 && (
                                                                <span>End: {formatDate(collection.end_mint_date)}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setSelectedCollection(null)}
                                                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors mt-3 md:mt-0"
                                                >
                                                    Back to Collections
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Loading preminted NFTs */}
                                {isLoading && (
                                    <div className="bg-gray-800 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-4">Loading NFTs...</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
                                                    <div className="w-full aspect-square bg-gray-600 rounded-lg mb-4"></div>
                                                    <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
                                                    <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preminted NFTs grid */}
                                {!isLoading && (
                                    <div className="bg-gray-800 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-4">Available NFTs</h3>

                                        {premintedNfts.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {premintedNfts.map((nft) => {
                                                    const collection = collections.find(c => c.publicKey.toString() === selectedCollection);
                                                    const price = collection?.mintPrice.toString() / 1_000_000_000 || 0;
                                                    const mintStatus = collection ? getMintStatus(collection) : { status: 'unavailable', label: 'Not Available' };
                                                    const canPurchase = mintStatus.status === 'active' && wallet.publicKey;

                                                    return (
                                                        <div key={nft.mint.toString()} className="bg-gray-700 rounded-lg overflow-hidden">
                                                            <div className="aspect-square relative bg-gray-600">
                                                                {!imageErrors[nft.mint.toString()] ? (
                                                                    <Image
                                                                        src={nft.uri || ''}
                                                                        alt={nft.name}
                                                                        fill
                                                                        style={{ objectFit: 'cover' }}
                                                                        onError={() => handleImageError(nft.mint.toString())}
                                                                    />
                                                                ) : (
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <p className="text-gray-400">Image not available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-4">
                                                                <h4 className="text-xl font-bold mb-2">{nft.name}</h4>

                                                                {nft.characterConfig && nft.characterConfig.toString() !== '11111111111111111111111111111111' && (
                                                                    <p className="text-green-400 text-sm mb-2">
                                                                        Includes AI Character Configuration
                                                                    </p>
                                                                )}

                                                                <div className="flex justify-between items-center mt-4">
                                                                    <span className="font-bold text-lg">{price} SOL</span>
                                                                    <button
                                                                        onClick={() => handlePurchaseNft(nft)}
                                                                        disabled={isPurchasing || !canPurchase}
                                                                        className={cn(
                                                                            "px-4 py-2 rounded transition-colors",
                                                                            (isPurchasing && purchasingNft === nft.mint.toString())
                                                                                ? "bg-yellow-600 cursor-wait"
                                                                                : canPurchase
                                                                                    ? "bg-purple-600 hover:bg-purple-700"
                                                                                    : mintStatus.status === 'unavailable'
                                                                                        ? "bg-red-700 cursor-not-allowed"
                                                                                        : mintStatus.status === 'upcoming'
                                                                                            ? "bg-yellow-700 cursor-not-allowed"
                                                                                            : mintStatus.status === 'ended'
                                                                                                ? "bg-gray-600 cursor-not-allowed"
                                                                                                : "bg-gray-600 cursor-not-allowed"
                                                                        )}
                                                                    >
                                                                        {isPurchasing && purchasingNft === nft.mint.toString()
                                                                            ? "Purchasing..."
                                                                            : !wallet.publicKey
                                                                                ? "Connect Wallet"
                                                                                : mintStatus.status === 'unavailable'
                                                                                    ? "Not Available"
                                                                                    : mintStatus.status === 'upcoming'
                                                                                        ? "Coming Soon"
                                                                                        : mintStatus.status === 'ended'
                                                                                            ? "Mint Ended"
                                                                                            : "Purchase"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 bg-gray-700 rounded-lg">
                                                <p className="text-xl mb-2">No NFTs Available</p>
                                                <p className="text-gray-400">
                                                    This collection doesn't have any preminted NFTs available for purchase at the moment.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </PageLayout>
    );
} 