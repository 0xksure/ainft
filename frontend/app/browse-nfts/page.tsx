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
import { fetchMetadata } from '../utils/metadata';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { getExplorerUrl, getExplorerName } from '../utils/explorer';

// A component to display a detailed countdown timer
interface CountdownData {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    hasTimeLeft: boolean;
}

interface CountdownTimerProps {
    countdownData: CountdownData | null;
    size?: 'small' | 'default' | 'large';
    className?: string;
}

const CountdownTimer = ({ countdownData, size = 'default', className = '' }: CountdownTimerProps) => {
    if (!countdownData || !countdownData.hasTimeLeft) return null;

    const { days, hours, minutes, seconds } = countdownData;

    // Different size presets
    const sizes = {
        small: {
            container: "py-1 px-2",
            unitContainer: "mx-1",
            number: "text-xs font-semibold",
            label: "text-[10px]"
        },
        default: {
            container: "py-1.5 px-3",
            unitContainer: "mx-1.5",
            number: "text-sm font-bold",
            label: "text-xs"
        },
        large: {
            container: "py-2 px-4",
            unitContainer: "mx-2",
            number: "text-md font-bold",
            label: "text-sm"
        }
    } as const;

    const sizeClass = sizes[size] || sizes.default;

    return (
        <div className={cn(
            "flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-md",
            sizeClass.container,
            className
        )}>
            {days > 0 && (
                <div className={cn("flex flex-col items-center", sizeClass.unitContainer)}>
                    <span className={cn("text-white", sizeClass.number)}>{days}</span>
                    <span className={cn("text-yellow-400", sizeClass.label)}>days</span>
                </div>
            )}
            <div className={cn("flex flex-col items-center", sizeClass.unitContainer)}>
                <span className={cn("text-white", sizeClass.number)}>{hours.toString().padStart(2, '0')}</span>
                <span className={cn("text-yellow-400", sizeClass.label)}>hrs</span>
            </div>
            <div className={cn("flex flex-col items-center", sizeClass.unitContainer)}>
                <span className={cn("text-white", sizeClass.number)}>{minutes.toString().padStart(2, '0')}</span>
                <span className={cn("text-yellow-400", sizeClass.label)}>min</span>
            </div>
            <div className={cn("flex flex-col items-center", sizeClass.unitContainer)}>
                <span className={cn("text-white", sizeClass.number)}>{seconds.toString().padStart(2, '0')}</span>
                <span className={cn("text-yellow-400", sizeClass.label)}>sec</span>
            </div>
        </div>
    );
};

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

    // Add state for structured countdown timers
    const [structuredCountdowns, setStructuredCountdowns] = useState<Record<string, any>>({});

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

        // Set up the countdown timer
        const intervalId = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);

            // Update countdowns for all collections with future start dates
            const updatedCountdowns: Record<string, string> = {};
            const updatedStructuredCountdowns: Record<string, any> = {};

            collections.forEach(collection => {
                // Check if collection has a start date in the future
                if (collection.startMintDate && collection.startMintDate > now) {
                    const timeRemaining = collection.startMintDate - now;
                    const collectionKey = collection.publicKey.toString();

                    // Update text countdowns for backward compatibility
                    updatedCountdowns[collectionKey] = formatTimeRemaining(timeRemaining);

                    // Update structured countdowns
                    updatedStructuredCountdowns[collectionKey] = getFormattedCountdown(timeRemaining);
                }
            });

            // Also include countdowns for NFTs in the selected collection
            if (selectedCollection) {
                const collection = collections.find(c => c.publicKey.toString() === selectedCollection);
                if (collection && collection.startMintDate && collection.startMintDate > now) {
                    // For each NFT in the collection, store the same countdown
                    premintedNfts.forEach(nft => {
                        const nftKey = nft.mint.toString();
                        const timeRemaining = collection.startMintDate - now;
                        updatedStructuredCountdowns[nftKey] = getFormattedCountdown(timeRemaining);
                    });
                }
            }

            setCountdowns(updatedCountdowns);
            setStructuredCountdowns(updatedStructuredCountdowns);
        }, 1000);

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, [collections, selectedCollection, premintedNfts]);

    // Load all collections
    const loadCollections = async () => {
        if (!program || !connection) return;

        setIsLoading(true);
        try {
            // Load all collections from all creators
            const allCollections = await fetchCollections(program, connection);
            console.log(allCollections);
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

            // Helper function to safely convert BN to number
            const safeToNumber = (bnValue: any) => {
                try {
                    return bnValue && typeof bnValue.toNumber === 'function' ? bnValue.toNumber() : 0;
                } catch (err) {
                    console.warn('Error converting BN to number:', err);
                    return 0;
                }
            };

            // Map to ensure type compatibility and convert name if needed
            const mappedNfts = preminted.map(nft => {
                // Convert name from number array to string if needed
                const name = typeof nft.name === 'string'
                    ? nft.name
                    : String.fromCharCode(...(nft.name as unknown as number[])).trim();

                // Convert message count from BN to number if needed (if present)
                const messageCount = nft.messageCount ? safeToNumber(nft.messageCount) : 0;

                return {
                    ...nft,
                    name,
                    messageCount,
                    // Use placeholder image initially - will be updated with metadata
                    uri: '/placeholder-nft.png'
                };
            });

            setPremintedNfts(mappedNfts);

            // Fetch metadata for each NFT to get the image URI
            const updatedNfts = [...mappedNfts];

            // Process NFTs in batches to avoid too many concurrent requests
            const batchSize = 5;
            for (let i = 0; i < updatedNfts.length; i += batchSize) {
                const batch = updatedNfts.slice(i, i + batchSize);
                await Promise.all(batch.map(async (nft, index) => {
                    try {
                        // Fetch the NFT metadata using Metaplex
                        const metadata = await fetchMetadata(connection, nft.mint);

                        // Log the metadata for debugging
                        console.log(`Metadata for NFT ${nft.mint.toString()}:`, metadata);

                        // Update the NFT with its metadata URI
                        if (metadata && metadata.data && metadata.data.data && metadata.data.data.uri) {
                            updatedNfts[i + index].uri = metadata.data.data.uri;
                        }
                    } catch (metadataErr) {
                        console.error(`Error fetching metadata for NFT ${nft.mint.toString()}:`, metadataErr);
                        // Log detailed error information
                        console.log(`Failed metadata fetch details - NFT: ${nft.name}, Mint: ${nft.mint.toString()}`);
                        // Keep the placeholder image if metadata fetch fails
                    }
                }));
            }

            // Update state with the NFTs that now have URIs
            setPremintedNfts([...updatedNfts]);
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

    // Format time remaining in human-readable format
    const formatTimeRemaining = (seconds: number): string => {
        if (seconds <= 0) return "Now";

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m ${secs}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    // Format time remaining in a structured format for the countdown display
    const getFormattedCountdown = (seconds: number) => {
        if (seconds <= 0) return null;

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return {
            days,
            hours,
            minutes,
            seconds: secs,
            hasTimeLeft: seconds > 0
        };
    };

    // Enhance date formatting to show both date and time clearly
    const formatDate = (timestamp: number) => {
        if (!timestamp || timestamp <= 0) return null;

        const date = new Date(timestamp * 1000);

        // Format date as "Mon, Jan 15, 2023"
        const dateString = date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Format time as "3:30 PM"
        const timeString = date.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `${dateString} at ${timeString}`;
    };

    // Format date for compact display (used in collection cards)
    const formatDateCompact = (timestamp: number) => {
        if (!timestamp || timestamp <= 0) return null;

        const date = new Date(timestamp * 1000);

        // Format date as "Jan 15"
        const dateString = date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });

        // Format time as "3:30 PM"
        const timeString = date.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `${dateString}, ${timeString}`;
    };

    // Get mint status
    const getMintStatus = (collection: any) => {
        if (!collection.premintingFinalized) {
            return { status: 'unavailable', label: 'Not Available', color: 'bg-red-600' };
        }

        const now = Math.floor(Date.now() / 1000);

        // Check if mint has started
        if (collection.startMintDate && collection.startMintDate > 0 && now < collection.startMintDate) {
            return { status: 'upcoming', label: 'Upcoming', color: 'bg-yellow-600' };
        }

        // Check if mint has ended
        if (collection.endMintDate && collection.endMintDate > 0 && now > collection.endMintDate) {
            return { status: 'ended', label: 'Ended', color: 'bg-gray-600' };
        }

        return { status: 'active', label: 'Active', color: 'bg-green-600' };
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
                                        const now = Math.floor(Date.now() / 1000);

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
                                                    {mintStatus.status === 'upcoming' && (
                                                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-2">
                                                            {structuredCountdowns[collectionKey] ? (
                                                                <CountdownTimer
                                                                    countdownData={structuredCountdowns[collectionKey]}
                                                                    size="small"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center text-xs font-medium bg-black/70 py-1 px-2 rounded">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="text-yellow-400">Starts in: </span>
                                                                    <span className="ml-1 text-white">{countdown}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    <h3 className="text-xl font-bold mb-1">{collection.name}</h3>
                                                    <p className="text-gray-400 mb-2">{collection.symbol}</p>
                                                    <div className="flex justify-between mb-3">
                                                        <span>
                                                            {collection.mintCount ? collection.mintCount.toString() : '0'}/
                                                            {collection.totalSupply ? collection.totalSupply.toString() : 'Unlimited'} Minted
                                                        </span>
                                                        <span>
                                                            {collection.mintPrice ? (collection.mintPrice.toString() / 1_000_000_000) : '0'} SOL
                                                        </span>
                                                    </div>

                                                    {/* New mint period indicator */}
                                                    <div className="border-t border-gray-600 pt-3 mt-2">
                                                        <div className="flex items-center mb-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-sm font-medium text-purple-400">Mint Period</span>
                                                        </div>

                                                        {/* Start date with indicator */}
                                                        <div className="flex flex-col text-xs space-y-1.5">
                                                            {collection.start_mint_date > 0 && (
                                                                <div className="flex items-start">
                                                                    <div className={`w-2 h-2 mt-1 mr-2 rounded-full ${now < collection.start_mint_date ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                                    <div>
                                                                        <span className="block text-gray-400">Starts:</span>
                                                                        <span className="text-white">{formatDateCompact(collection.startMintDate)}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* End date with indicator */}
                                                            {collection.endMintDate > 0 && (
                                                                <div className="flex items-start">
                                                                    <div className={`w-2 h-2 mt-1 mr-2 rounded-full ${now < collection.endMintDate ? (now < collection.startMintDate ? 'bg-gray-500' : 'bg-yellow-500') : 'bg-red-500'}`}></div>
                                                                    <div>
                                                                        <span className="block text-gray-400">Ends:</span>
                                                                        <span className="text-white">{formatDateCompact(collection.endMintDate)}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* If no dates are set */}
                                                            {!collection.startMintDate && !collection.endMintDate && (
                                                                <span className="text-gray-400">No mint schedule set</span>
                                                            )}
                                                        </div>
                                                    </div>
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
                                        const now = Math.floor(Date.now() / 1000);

                                        return (
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h2 className="text-2xl font-semibold">{collection.name}</h2>
                                                        <span className={`px-2 py-1 rounded-full text-xs text-white ${mintStatus.color}`}>
                                                            {mintStatus.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 mb-3">
                                                        {collection.mintCount ? collection.mintCount.toString() : '0'}/
                                                        {collection.totalSupply ? collection.totalSupply.toString() : 'Unlimited'} Minted •
                                                        Base Price: {collection.mintPrice ? (collection.mintPrice.toString() / 1_000_000_000) : '0'} SOL
                                                    </p>

                                                    {/* Enhanced mint period display for detail view */}
                                                    <div className="bg-gray-700/50 rounded-lg p-3 mt-3 max-w-lg">
                                                        <div className="flex items-center mb-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="font-medium text-white">Mint Schedule</span>
                                                        </div>

                                                        {collection.start_mint_date > 0 && (
                                                            <div className="mb-3 flex flex-col sm:flex-row sm:items-center">
                                                                <div className="flex items-center mb-1 sm:mb-0 sm:mr-4">
                                                                    <div className={`w-3 h-3 mr-2 rounded-full ${now < collection.start_mint_date ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                                    <span className="font-medium">Start Date:</span>
                                                                </div>
                                                                <span className="text-gray-300">{formatDate(collection.start_mint_date)}</span>
                                                            </div>
                                                        )}

                                                        {collection.endMintDate > 0 && (
                                                            <div className="mb-3 flex flex-col sm:flex-row sm:items-center">
                                                                <div className="flex items-center mb-1 sm:mb-0 sm:mr-4">
                                                                    <div className={`w-3 h-3 mr-2 rounded-full ${now < collection.endMintDate ? (now < collection.startMintDate ? 'bg-gray-500' : 'bg-yellow-500') : 'bg-red-500'}`}></div>
                                                                    <span className="font-medium">End Date:</span>
                                                                </div>
                                                                <span className="text-gray-300">{formatDate(collection.endMintDate)}</span>
                                                            </div>
                                                        )}

                                                        {/* Show mint countdown in detail view */}
                                                        {mintStatus.status === 'upcoming' && (
                                                            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-md p-3">
                                                                <div className="flex items-center mb-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="font-medium text-yellow-400">Mint starts in:</span>
                                                                </div>

                                                                {structuredCountdowns[selectedCollection] ? (
                                                                    <CountdownTimer
                                                                        countdownData={structuredCountdowns[selectedCollection]}
                                                                        size="large"
                                                                        className="mt-2"
                                                                    />
                                                                ) : (
                                                                    <div className="text-yellow-400 font-bold text-lg ml-7">
                                                                        {countdown || 'Loading...'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {mintStatus.status === 'active' && (
                                                            <div className="bg-green-900/30 text-green-400 px-3 py-2 rounded-md flex items-center text-sm">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="font-normal">Minting is active now</span>
                                                                {collection.endMintDate > 0 && now < collection.endMintDate && (
                                                                    <span className="ml-2">
                                                                        (Ends in {formatTimeRemaining(collection.endMintDate - now)})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {mintStatus.status === 'ended' && (
                                                            <div className="bg-red-900/30 text-red-400 px-3 py-2 rounded-md flex items-center text-sm">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="font-normal">Minting period has ended</span>
                                                            </div>
                                                        )}

                                                        {!collection.startMintDate && !collection.endMintDate && (
                                                            <p className="text-gray-400 text-sm italic">No mint schedule set for this collection</p>
                                                        )}
                                                    </div>
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
                                                    console.log(nft);
                                                    const collection = collections.find(c => c.publicKey.toString() === selectedCollection);
                                                    const price = collection?.mintPrice.toString() / 1_000_000_000 || 0;
                                                    const mintStatus = collection ? getMintStatus(collection) : { status: 'unavailable', label: 'Not Available' };
                                                    const canPurchase = mintStatus.status === 'active' && wallet.publicKey;

                                                    // Determine image source with basic URL validation
                                                    let nftImageSrc = '/placeholder-nft.png';
                                                    if (typeof nft.uri === 'string' && nft.uri.trim() !== '') {
                                                        try {
                                                            // Basic URL validation
                                                            new URL(nft.uri);
                                                            nftImageSrc = nft.uri;
                                                        } catch (e) {
                                                            console.warn(`Invalid URI: ${nft.uri}`);
                                                        }
                                                    }

                                                    const nftId = nft.mint.toString();

                                                    return (
                                                        <div key={nftId} className="bg-gray-700 rounded-lg overflow-hidden">
                                                            <div className="aspect-square relative bg-gray-600">
                                                                {!imageErrors[nftId] ? (
                                                                    nftImageSrc.startsWith('/') ? (
                                                                        // Use Next.js Image for local files and placeholder images
                                                                        <Image
                                                                            src={nftImageSrc}
                                                                            alt={(typeof nft.name === 'string' && nft.name.trim() !== '') ?
                                                                                nft.name : "NFT Image"}
                                                                            fill
                                                                            style={{ objectFit: 'cover' }}
                                                                            onError={() => handleImageError(nftId)}
                                                                        />
                                                                    ) : (
                                                                        // Use regular img tag for external URLs to avoid domain restrictions
                                                                        <img
                                                                            src={nftImageSrc}
                                                                            alt={(typeof nft.name === 'string' && nft.name.trim() !== '') ?
                                                                                nft.name : "NFT Image"}
                                                                            className="absolute inset-0 w-full h-full object-cover"
                                                                            onError={() => handleImageError(nftId)}
                                                                        />
                                                                    )
                                                                ) : (
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="text-center p-4">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                            <p className="text-gray-400 text-sm">Image not available</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Show countdown on NFT if mint hasn't started */}
                                                                {mintStatus.status === 'upcoming' && structuredCountdowns[nftId] && (
                                                                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-2">
                                                                        <CountdownTimer
                                                                            countdownData={structuredCountdowns[nftId]}
                                                                            size="small"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-4">
                                                                <h4 className="text-xl font-bold mb-2">
                                                                    {(typeof nft.name === 'string' && nft.name.trim() !== '') ?
                                                                        nft.name : "Unnamed NFT"}
                                                                </h4>

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
                                                                            (isPurchasing && purchasingNft === nftId)
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
                                                                        {isPurchasing && purchasingNft === nftId
                                                                            ? "Purchasing..."
                                                                            : !wallet.publicKey
                                                                                ? "Connect Wallet"
                                                                                : mintStatus.status === 'unavailable'
                                                                                    ? "Not Available"
                                                                                    : mintStatus.status === 'upcoming'
                                                                                        ? structuredCountdowns[nftId]
                                                                                            ? `Available in ${formatTimeRemaining(
                                                                                                structuredCountdowns[nftId].days * 86400 +
                                                                                                structuredCountdowns[nftId].hours * 3600 +
                                                                                                structuredCountdowns[nftId].minutes * 60 +
                                                                                                structuredCountdowns[nftId].seconds
                                                                                            )}`
                                                                                            : "Coming Soon"
                                                                                        : mintStatus.status === 'ended'
                                                                                            ? "Mint Ended"
                                                                                            : "Purchase"
                                                                        }
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