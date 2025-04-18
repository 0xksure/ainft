'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../../stores/networkStore';
import {
    useAnchorProgram,
    fetchCollections,
    fetchPremintedNfts,
    premintNft,
    finalizePreminting,
    updateCollection
} from '../../utils/anchor';
import { fetchMetadata } from '../../utils/metadata';
import PageLayout from '../../components/PageLayout';
import { motion } from 'framer-motion';
import { cn } from '../../components/ui/utils';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import CopyableAddress from '../../components/CopyableAddress';
import {
    X,
    Plus,
    ArrowLeft,
    Copy,
    ExternalLink,
    Image as ImageIcon
} from 'lucide-react';
import { getExplorerUrl, getExplorerName } from '../../utils/explorer';
import { useToast } from '../../components/ui/toast';

// Types matching what fetchCollections and fetchPremintedNfts return
type Collection = {
    publicKey: PublicKey;
    authority: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    mint: PublicKey;
    description?: string;
    mintPrice: any;
    totalSupply?: any;
    maxSupply?: any;
    mintCount: any;
    royaltyBasisPoints: number;
    startMintDate?: any;
    endMintDate?: any;
    premintingFinalized?: boolean;
    bump?: any;
};

type PremintedNft = {
    publicKey: PublicKey;
    aiNft: PublicKey;
    mint: PublicKey;
    name: string;
    executionClient: PublicKey;
    tokenAccount: PublicKey;
    computeTokenAccount: PublicKey;
    characterConfig: PublicKey;
    isPreminted: boolean;
    isMinted: boolean;
    messageCount: number;
    bump: number[];
    uri?: string; // We'll need to add this when fetching
};

export default function CollectionDetailsPage() {
    const params = useParams();
    const collectionId = params?.collectionId as string || '';
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const router = useRouter();
    const { addToast } = useToast();

    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // Collection state
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loadingCollection, setLoadingCollection] = useState(true);

    // NFTs state
    const [nfts, setNfts] = useState<PremintedNft[]>([]);
    const [loadingNfts, setLoadingNfts] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nftName, setNftName] = useState('');
    const [nftUri, setNftUri] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [imageError, setImageError] = useState(false);

    // Transaction state
    const [isPreminting, setIsPreminting] = useState(false);
    const [premintTxHash, setPremintTxHash] = useState<string | null>(null);
    const [premintedNftAddress, setPremintedNftAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Add state for finalization
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [finalizeTxHash, setFinalizeTxHash] = useState<string | null>(null);

    // Add state for edit collection modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editCollectionName, setEditCollectionName] = useState('');
    const [editCollectionUri, setEditCollectionUri] = useState('');
    const [editCollectionDescription, setEditCollectionDescription] = useState('');
    const [editCollectionMintPrice, setEditCollectionMintPrice] = useState(0);
    const [editCollectionStartDate, setEditCollectionStartDate] = useState<Date | null>(null);
    const [editCollectionEndDate, setEditCollectionEndDate] = useState<Date | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateTxHash, setUpdateTxHash] = useState<string | null>(null);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load collection and NFTs when wallet and program are ready
    useEffect(() => {
        if (isClient && wallet.publicKey && program && !programLoading) {
            loadCollection();
        }
    }, [isClient, wallet.publicKey, program, programLoading, collectionId]);

    // Populate edit modal fields when opened
    useEffect(() => {
        if (isEditModalOpen && collection) {
            setEditCollectionName(collection.name);
            setEditCollectionUri(collection.uri);
            setEditCollectionDescription(collection.description || '');
            setEditCollectionMintPrice(collection.mintPrice);

            if (collection.startMintDate) {
                setEditCollectionStartDate(new Date(collection.startMintDate * 1000));
            } else {
                setEditCollectionStartDate(null);
            }

            if (collection.endMintDate) {
                setEditCollectionEndDate(new Date(collection.endMintDate * 1000));
            } else {
                setEditCollectionEndDate(null);
            }
        }
    }, [isEditModalOpen, collection]);

    const loadCollection = async () => {
        if (!program || !wallet.publicKey || !connection) return;

        try {
            setLoadingCollection(true);
            setError(null);

            // Load all collections for this wallet
            const collections = await fetchCollections(program, connection, wallet.publicKey);

            // Find the specific collection by ID
            const collectionPublicKey = new PublicKey(collectionId);
            const foundCollection = collections.find(c =>
                c.publicKey.toString() === collectionPublicKey.toString()
            );

            if (!foundCollection) {
                setError("Collection not found");
                return;
            }
            console.log('foundCollection', foundCollection);

            // Safe conversion function with fallback
            const safeToNumber = (bnValue: any) => {
                try {
                    return bnValue && typeof bnValue.toNumber === 'function' ? bnValue.toNumber() : 0;
                } catch (err) {
                    console.warn('Error converting BN to number:', err);
                    return 0;
                }
            };

            // Use type assertion to safely access fields that might not exist in the type definition
            const anyCollection = foundCollection as any;

            // Map the collection to our internal type safely
            const mappedCollection = {
                ...foundCollection,
                mintPrice: safeToNumber(foundCollection.mintPrice),
                totalSupply: safeToNumber(anyCollection.totalSupply || anyCollection.maxSupply),
                mintCount: safeToNumber(foundCollection.mintCount),
                startMintDate: safeToNumber(anyCollection.startMintDate),
                endMintDate: safeToNumber(anyCollection.endMintDate),
                // Include premintingFinalized field
                premintingFinalized: anyCollection.premintingFinalized || false,
                // Include any extra fields we might need
                description: anyCollection.description || ''
            };

            setCollection(mappedCollection);

            // Now load the NFTs for this collection
            await loadNfts(collectionPublicKey);

        } catch (err) {
            console.error('Error loading collection:', err);
            setError(err instanceof Error ? err.message : 'Failed to load collection');
        } finally {
            setLoadingCollection(false);
        }
    };

    const loadNfts = async (collectionPublicKey: PublicKey) => {
        if (!program || !connection) return;

        try {
            setLoadingNfts(true);

            // Helper function to safely convert BN to number
            const safeToNumber = (bnValue: any) => {
                try {
                    return bnValue && typeof bnValue.toNumber === 'function' ? bnValue.toNumber() : 0;
                } catch (err) {
                    console.warn('Error converting BN to number:', err);
                    return 0;
                }
            };

            // Fetch preminted NFTs for this collection
            const premintedNfts = await fetchPremintedNfts(program, connection, collectionPublicKey);

            // Map to ensure type compatibility
            const mappedNfts = premintedNfts.map(nft => {
                // Use type assertion to safely access properties
                const nftAny = nft as any;

                // Convert name from number array to string if needed
                const name = typeof nft.name === 'string'
                    ? nft.name
                    : String.fromCharCode(...(nft.name as unknown as number[])).trim();

                // Convert message count from BN to number if needed
                const messageCount = safeToNumber(nft.messageCount);

                // Create a well-typed NFT object
                return {
                    publicKey: nft.publicKey,
                    aiNft: nft.aiNft,
                    mint: nft.mint,
                    name,
                    executionClient: nft.executionClient,
                    tokenAccount: nft.tokenAccount,
                    computeTokenAccount: nft.computeTokenAccount,
                    characterConfig: nft.characterConfig,
                    isPreminted: nft.isPreminted,
                    isMinted: nft.isMinted,
                    messageCount,
                    bump: nft.bump,
                    // Use placeholder image initially - will be updated with metadata
                    uri: '/placeholder-nft.png'
                } as PremintedNft;
            });

            setNfts(mappedNfts);

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

                        // Update the NFT with its metadata URI
                        if (metadata && metadata.data && metadata.data.data && metadata.data.data.uri) {
                            updatedNfts[i + index].uri = metadata.data.data.uri;
                        }
                    } catch (metadataErr) {
                        console.error(`Error fetching metadata for NFT ${nft.mint.toString()}:`, metadataErr);
                        // Keep the placeholder image if metadata fetch fails
                    }
                }));
            }

            // Update state with the NFTs that now have URIs
            setNfts([...updatedNfts]);
        } catch (err) {
            console.error('Error loading NFTs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load NFTs');
        } finally {
            setLoadingNfts(false);
        }
    };

    // Handle URL input and validation
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNftUri(value);

        // Basic URL validation
        try {
            if (value) {
                new URL(value);
                setPreviewUrl(value);
                setImageError(false); // Reset image error state
            } else {
                setPreviewUrl('');
            }
        } catch (err) {
            setPreviewUrl('');
        }
    };

    // Image error handler
    const handleImageError = () => {
        console.log('Image failed to load:', previewUrl);
        setImageError(true);
    };

    // Handle NFT creation form submission
    const handlePremintSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!program || !wallet.publicKey || !collection || !connection) {
            setError("Program, wallet, connection, or collection not available");
            return;
        }

        try {
            setIsPreminting(true);
            setError(null);

            // Premint NFT
            const result = await premintNft(
                program,
                wallet,
                connection,
                collection.name, // Collection name
                nftName, // NFT name
                nftUri, // NFT URI
                collection.mintPrice, // Price (number)
                undefined // No character config ID
            );

            setPremintTxHash(result.txId);
            setPremintedNftAddress(result.nftMintAddress.toString());

            // Close modal
            setIsModalOpen(false);

            // Reset form
            setNftName('');
            setNftUri('');
            setPreviewUrl('');

            // Reload collection and NFTs
            await loadCollection();

        } catch (err) {
            console.error('Error preminting NFT:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsPreminting(false);
        }
    };

    // Reset the form when modal is closed
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNftName('');
        setNftUri('');
        setPreviewUrl('');
        setImageError(false);
        setError(null);
    };

    // Add a handler for finalizing preminting
    const handleFinalizePreminting = async () => {
        if (!program || !wallet.publicKey || !collection || !connection) {
            setError("Program, wallet, connection, or collection not available");
            return;
        }

        // Confirm action with the user
        const confirmed = window.confirm(
            "Are you sure you want to finalize preminting for this collection? " +
            "This action is irreversible and will prevent any further NFTs from being created in this collection."
        );

        if (!confirmed) return;

        try {
            setIsFinalizing(true);
            setError(null);

            // Call the finalizePreminting function
            const result = await finalizePreminting(
                program,
                wallet,
                connection,
                collection.name
            );

            setFinalizeTxHash(result.txId);

            // Reload collection to reflect updated state
            await loadCollection();

            // Show success message with Toast instead of alert
            addToast("Preminting has been successfully finalized for this collection!", "success");

        } catch (err) {
            console.error('Error finalizing preminting:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            addToast(err instanceof Error ? err.message : 'Unknown error occurred', "error");
        } finally {
            setIsFinalizing(false);
        }
    };

    // Update setIsModalOpen to check for finalized status
    const openModal = () => {
        if (collection?.premintingFinalized) {
            addToast("This collection has been finalized and no new NFTs can be added.", "warning");
            return;
        }
        setIsModalOpen(true);
    };

    // Handle collection edit form submission
    const handleUpdateCollection = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!program || !wallet.publicKey || !collection || !connection) {
            setError("Program, wallet, connection, or collection not available");
            return;
        }

        try {
            setIsUpdating(true);
            setError(null);

            // Convert dates to unix timestamps or -1 to explicitly set null
            // This ensures we send a value to the program that can be recognized as "cleared" vs "unchanged"
            const startMintDate = editCollectionStartDate
                ? Math.floor(editCollectionStartDate.getTime() / 1000)
                : -1; // Use -1 to indicate explicitly clearing the date

            const endMintDate = editCollectionEndDate
                ? Math.floor(editCollectionEndDate.getTime() / 1000)
                : -1; // Use -1 to indicate explicitly clearing the date

            // Check if dates have actually changed
            const startDateChanged =
                (startMintDate === -1 && collection.startMintDate > 0) || // Date was removed
                (startMintDate > 0 && startMintDate !== collection.startMintDate); // Date was changed

            const endDateChanged =
                (endMintDate === -1 && collection.endMintDate > 0) || // Date was removed
                (endMintDate > 0 && endMintDate !== collection.endMintDate); // Date was changed

            // Log for debugging
            console.log("Updating collection with dates:", {
                currentStart: collection.startMintDate,
                newStart: startMintDate,
                startChanged: startDateChanged,
                currentEnd: collection.endMintDate,
                newEnd: endMintDate,
                endChanged: endDateChanged
            });

            // Update collection
            const result = await updateCollection(
                program,
                wallet,
                connection,
                collection.name,
                {
                    newName: editCollectionName !== collection.name ? editCollectionName : undefined,
                    newUri: editCollectionUri !== collection.uri ? editCollectionUri : undefined,
                    newDescription: editCollectionDescription !== collection.description ? editCollectionDescription : undefined,
                    newMintPrice: editCollectionMintPrice !== collection.mintPrice ? editCollectionMintPrice : undefined,
                    // Always send dates if they've changed (including being cleared)
                    newStartMintDate: startDateChanged ? (startMintDate === -1 ? 0 : startMintDate) : undefined,
                    newEndMintDate: endDateChanged ? (endMintDate === -1 ? 0 : endMintDate) : undefined
                }
            );

            setUpdateTxHash(result.txId);

            // Close modal
            setIsEditModalOpen(false);

            // Reload collection to show updated data
            await loadCollection();

            // Show success message with Toast instead of alert
            addToast("Collection has been successfully updated!", "success");

        } catch (err) {
            console.error('Error updating collection:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            addToast(err instanceof Error ? err.message : 'Unknown error occurred', "error");
        } finally {
            setIsUpdating(false);
        }
    };

    // Reset form when modal is closed
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setError(null);
    };

    // Add helper functions for mint period
    const calculateMintPeriodProgress = (startTimestamp: number, endTimestamp: number) => {
        const now = Math.floor(Date.now() / 1000);

        // If mint period hasn't started yet
        if (now < startTimestamp) return 0;

        // If mint period has ended
        if (now > endTimestamp) return 100;

        // Calculate progress
        const totalDuration = endTimestamp - startTimestamp;
        const elapsed = now - startTimestamp;
        return Math.min(Math.round((elapsed / totalDuration) * 100), 100);
    };

    const getMintPeriodStatus = (startTimestamp: number, endTimestamp: number) => {
        const now = Math.floor(Date.now() / 1000);

        // Calculate time differences
        const secondsUntilStart = startTimestamp - now;
        const secondsUntilEnd = endTimestamp - now;

        if (secondsUntilStart > 0) {
            // Mint hasn't started yet
            const days = Math.floor(secondsUntilStart / 86400);
            const hours = Math.floor((secondsUntilStart % 86400) / 3600);

            if (days > 0) {
                return `Mint starts in ${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
                const minutes = Math.floor((secondsUntilStart % 3600) / 60);
                return `Mint starts in ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
        } else if (secondsUntilEnd > 0) {
            // Mint is active
            const days = Math.floor(secondsUntilEnd / 86400);
            const hours = Math.floor((secondsUntilEnd % 86400) / 3600);

            if (days > 0) {
                return `Mint ends in ${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
                const minutes = Math.floor((secondsUntilEnd % 3600) / 60);
                return `Mint ends in ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
        } else {
            // Mint has ended
            return 'Mint period has ended';
        }
    };

    // Only render wallet-dependent content on the client
    if (!isClient) {
        return (
            <PageLayout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Collection Details</h1>
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
                    {/* Back button */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.push('/manage-collections')}
                            className="flex items-center text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Collections
                        </button>
                    </div>

                    {!wallet.publicKey ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Connect your wallet to view this collection</p>
                            <p>Please use the wallet button in the header to connect.</p>
                        </div>
                    ) : programLoading || loadingCollection ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Loading collection...</p>
                            <div className="animate-pulse h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                            <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ) : programError ? (
                        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Error loading program</p>
                            <p>{programError.message}</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Error</p>
                            <p>{error}</p>
                        </div>
                    ) : collection ? (
                        <>
                            {/* Success message for preminted NFT */}
                            {(premintTxHash && premintedNftAddress) || finalizeTxHash ? (
                                <div className="bg-green-900/50 border border-green-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">
                                        {finalizeTxHash ? "Preminting Finalized Successfully!" : "NFT Preminted Successfully!"}
                                    </h2>
                                    {finalizeTxHash ? (
                                        <p className="mb-2">Your collection preminting has been finalized on the {network} network.</p>
                                    ) : (
                                        <>
                                            <p className="mb-2">Your AI NFT has been preminted on the {network} network.</p>
                                            <p className="mb-4">
                                                <span className="font-semibold">NFT Mint Address:</span>{' '}
                                                <code className="bg-black/30 px-2 py-1 rounded">{premintedNftAddress}</code>
                                            </p>
                                        </>
                                    )}
                                    <p>
                                        <span className="font-semibold">Transaction:</span>{' '}
                                        <a
                                            href={getExplorerUrl('tx', finalizeTxHash || premintTxHash || '', network)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline"
                                        >
                                            View on {getExplorerName(network)} Explorer
                                        </a>
                                    </p>
                                </div>
                            ) : null}

                            {/* Collection Header */}
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Collection Image */}
                                    <div className="w-full md:w-1/4">
                                        <div className="aspect-square bg-gray-700 rounded-lg relative overflow-hidden">
                                            <img
                                                src={collection.uri}
                                                alt={collection.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.currentTarget as HTMLImageElement;
                                                    target.src = "/placeholder-collection.png";
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Collection Details */}
                                    <div className="w-full md:w-3/4">
                                        <div className="flex flex-col h-full">
                                            <div className="flex-grow">
                                                <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
                                                    <span className="bg-purple-900/50 px-2 py-0.5 rounded-full">{collection.symbol}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center">
                                                        <CopyableAddress address={collection.publicKey} />
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                                        <h3 className="text-sm text-gray-400 mb-1">NFT Supply</h3>
                                                        <div className="text-xl font-semibold">
                                                            {collection.mintCount} {collection.totalSupply > 0 ? `/ ${collection.totalSupply}` : '(Unlimited)'}
                                                        </div>
                                                        <div className="mt-2 relative h-2 bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                                                                style={{ width: `${collection.totalSupply > 0 ? (collection.mintCount / collection.totalSupply) * 100 : 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                                        <h3 className="text-sm text-gray-400 mb-1">Mint Price</h3>
                                                        <div className="text-xl font-semibold">{collection.mintPrice / 1_000_000_000} SOL</div>
                                                        <div className="text-sm text-gray-400 mt-1">
                                                            ≈ ${((collection.mintPrice / 1_000_000_000) * 150).toFixed(2)} USD
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                                        <h3 className="text-sm text-gray-400 mb-1">Royalty</h3>
                                                        <div className="text-xl font-semibold">{collection.royaltyBasisPoints / 100}%</div>
                                                        <div className="text-sm text-gray-400 mt-1">
                                                            On secondary sales
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                                        <h3 className="text-sm text-gray-400 mb-1">Network</h3>
                                                        <div className="text-xl font-semibold capitalize">{network}</div>
                                                        <div className="text-sm text-gray-400 mt-1">
                                                            Collection Contract
                                                        </div>
                                                    </div>

                                                    {/* Mint Period Information */}
                                                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 col-span-1 md:col-span-2 border border-purple-800/30">
                                                        <h3 className="text-sm text-gray-300 mb-3 font-medium flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                            </svg>
                                                            Mint Period
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <h4 className="text-xs text-gray-400 mb-1">Start Date</h4>
                                                                <div className="text-lg font-semibold">
                                                                    {collection.startMintDate > 0
                                                                        ? new Date(collection.startMintDate * 1000).toLocaleString()
                                                                        : "No start date set"}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs text-gray-400 mb-1">End Date</h4>
                                                                <div className="text-lg font-semibold">
                                                                    {collection.endMintDate > 0
                                                                        ? new Date(collection.endMintDate * 1000).toLocaleString()
                                                                        : "No end date set"}
                                                                </div>
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2">
                                                                {collection.startMintDate > 0 && collection.endMintDate > 0 && (
                                                                    <>
                                                                        <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                                                                            <div
                                                                                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                                                                                style={{
                                                                                    width: `${calculateMintPeriodProgress(collection.startMintDate, collection.endMintDate)}%`
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                        <div className="text-xs text-gray-400 mt-2">
                                                                            {getMintPeriodStatus(collection.startMintDate, collection.endMintDate)}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {collection.startMintDate > 0 && (
                                                        <div className="bg-gray-700/50 rounded-lg p-4" style={{ display: 'none' }}>
                                                            <h3 className="text-sm text-gray-400 mb-1">Start Date</h3>
                                                            <div className="text-xl font-semibold">
                                                                {new Date(collection.startMintDate * 1000).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {collection.endMintDate > 0 && (
                                                        <div className="bg-gray-700/50 rounded-lg p-4" style={{ display: 'none' }}>
                                                            <h3 className="text-sm text-gray-400 mb-1">End Date</h3>
                                                            <div className="text-xl font-semibold">
                                                                {new Date(collection.endMintDate * 1000).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                {collection.premintingFinalized ? (
                                                    <div className="flex gap-4">
                                                        <div className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium inline-flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Preminting Finalized
                                                        </div>
                                                        <button
                                                            onClick={() => setIsEditModalOpen(true)}
                                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all inline-flex items-center"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                            Edit Collection
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => openModal()}
                                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium 
                                                            hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center"
                                                        >
                                                            <Plus size={18} className="mr-2" />
                                                            Add New NFT
                                                        </button>

                                                        <button
                                                            onClick={handleFinalizePreminting}
                                                            disabled={isFinalizing}
                                                            className={cn(
                                                                "px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg font-medium transition-all inline-flex items-center",
                                                                isFinalizing && "opacity-50 cursor-not-allowed"
                                                            )}
                                                        >
                                                            {isFinalizing ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Finalizing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Finalize Preminting
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => setIsEditModalOpen(true)}
                                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all inline-flex items-center"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                            Edit Collection
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NFTs Grid */}
                            <h2 className="text-2xl font-bold mb-4">Collection NFTs</h2>

                            {/* Loading state for NFTs */}
                            {loadingNfts ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                                            <div className="aspect-square bg-gray-700 rounded-lg mb-4"></div>
                                            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : nfts.length === 0 ? (
                                <div className="text-center py-16 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
                                        <ImageIcon size={32} className="text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-medium mb-2">No NFTs Yet</h3>
                                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                        {collection.premintingFinalized
                                            ? "This collection has been finalized with no NFTs. Preminting is now closed."
                                            : "You haven't preminted any NFTs in this collection yet. Create your first AI NFT to get started."}
                                    </p>
                                    {!collection.premintingFinalized && (
                                        <button
                                            onClick={() => openModal()}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium 
                                            hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center"
                                        >
                                            <Plus size={18} className="mr-2" />
                                            Create First NFT
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {/* Add NFT Card */}
                                    {!collection.premintingFinalized && (
                                        <div
                                            className="bg-gray-800/70 border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-purple-500 
                                            transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px]"
                                            onClick={() => openModal()}
                                        >
                                            <div className="w-16 h-16 bg-gray-700/70 rounded-full flex items-center justify-center mb-4">
                                                <Plus size={24} className="text-purple-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-center mb-2">Add New NFT</h3>
                                            <p className="text-gray-400 text-sm text-center">
                                                Create a new preminted NFT in this collection
                                            </p>
                                        </div>
                                    )}

                                    {/* NFT Cards */}
                                    {nfts.map((nft) => (
                                        <div
                                            key={nft.publicKey.toString()}
                                            className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500 
                                transition-all"
                                        >
                                            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                                                {nft.uri ? (
                                                    <img
                                                        src={nft.uri}
                                                        alt={nft.name}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.currentTarget as HTMLImageElement;
                                                            target.src = "/placeholder-nft.png";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <ImageIcon size={48} className="text-gray-600" />
                                                    </div>
                                                )}

                                                <div className="absolute top-2 right-2">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-1 text-xs",
                                                        nft.isMinted
                                                            ? "bg-green-900/70 text-green-300"
                                                            : "bg-blue-900/70 text-blue-300"
                                                    )}>
                                                        {nft.isMinted ? "Minted" : "Preminted"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                <h3 className="font-bold mb-1 truncate">{nft.name}</h3>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-400">
                                                        #{nft.mint.toString().substring(0, 4)}...
                                                    </div>
                                                    <a
                                                        href={getExplorerUrl('address', nft.mint.toString(), network)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Collection not found</p>
                            <Link
                                href="/manage-collections"
                                className="text-blue-400 hover:text-blue-300"
                            >
                                Return to collections
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Modal for creating a new NFT */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-gray-800 rounded-lg w-full max-w-3xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-700 p-4">
                            <h2 className="text-xl font-bold">Create New AI NFT</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Form */}
                                <div>
                                    <form className="space-y-6" onSubmit={handlePremintSubmit}>
                                        {error && (
                                            <div className="bg-red-900/30 border border-red-700 p-3 rounded-md text-sm">
                                                {error}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block mb-2">NFT Name</label>
                                            <input
                                                type="text"
                                                value={nftName}
                                                onChange={(e) => setNftName(e.target.value)}
                                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                placeholder="Enter a name for this NFT"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2">NFT Image URL</label>
                                            <input
                                                type="text"
                                                value={nftUri}
                                                onChange={handleUrlChange}
                                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                placeholder="https://example.com/your-nft-image"
                                                required
                                            />
                                            <p className="text-sm text-gray-400 mt-1">
                                                Enter the URL for this NFT's image
                                            </p>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={isPreminting}
                                                className={cn(
                                                    "w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
                                                    isPreminting ? "opacity-70 cursor-not-allowed" : "hover:from-purple-700 hover:to-blue-700"
                                                )}
                                            >
                                                {isPreminting ? "Preminting NFT..." : "Premint NFT"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Preview */}
                                <div>
                                    <h3 className="font-medium mb-3">Preview</h3>
                                    <div className="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                        {previewUrl ? (
                                            <div className="relative w-full h-full">
                                                {!imageError ? (
                                                    <img
                                                        src={previewUrl}
                                                        alt={nftName || "NFT Image"}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        onError={handleImageError}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                                        <p className="text-red-400 mb-2">Image couldn't be displayed</p>
                                                        <div className="bg-gray-900 p-3 rounded-md w-full max-w-xs overflow-hidden">
                                                            <p className="text-xs text-gray-400 truncate">{previewUrl}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center p-8">
                                                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-600 rounded-full mb-2">
                                                    <ImageIcon size={24} className="text-gray-400" />
                                                </div>
                                                <p className="text-gray-400">Enter a valid URL to see a preview</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 bg-blue-900/30 rounded-lg">
                                        <h3 className="font-semibold mb-2">About Preminting</h3>
                                        <p className="text-sm text-gray-300">
                                            Preminting allows you to create NFTs in advance that users can purchase.
                                            Each NFT can be customized with different AI character settings by its owner.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for editing a collection */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-gray-800 rounded-lg w-full max-w-3xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-700 p-4">
                            <h2 className="text-xl font-bold">Edit Collection</h2>
                            <button
                                onClick={handleCloseEditModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <form className="space-y-6" onSubmit={handleUpdateCollection}>
                                {error && (
                                    <div className="bg-red-900/30 border border-red-700 p-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block mb-2">Collection Name</label>
                                    <input
                                        type="text"
                                        value={editCollectionName}
                                        onChange={(e) => setEditCollectionName(e.target.value)}
                                        className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter collection name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2">Collection Image URL</label>
                                    <input
                                        type="text"
                                        value={editCollectionUri}
                                        onChange={(e) => setEditCollectionUri(e.target.value)}
                                        className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="https://example.com/your-collection-image"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2">Collection Description</label>
                                    <textarea
                                        value={editCollectionDescription}
                                        onChange={(e) => setEditCollectionDescription(e.target.value)}
                                        className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Describe your collection"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2">Mint Price (in lamports)</label>
                                    <input
                                        type="number"
                                        value={editCollectionMintPrice}
                                        onChange={(e) => setEditCollectionMintPrice(Number(e.target.value))}
                                        className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter mint price in lamports"
                                        required
                                    />
                                    <p className="text-sm text-gray-400 mt-1">
                                        {(editCollectionMintPrice / 1_000_000_000).toFixed(9)} SOL
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2">Start Mint Date (optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={editCollectionStartDate ? editCollectionStartDate.toISOString().slice(0, 16) : ''}
                                            onChange={(e) => setEditCollectionStartDate(e.target.value ? new Date(e.target.value) : null)}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">End Mint Date (optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={editCollectionEndDate ? editCollectionEndDate.toISOString().slice(0, 16) : ''}
                                            onChange={(e) => setEditCollectionEndDate(e.target.value ? new Date(e.target.value) : null)}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className={cn(
                                            "w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
                                            isUpdating ? "opacity-70 cursor-not-allowed" : "hover:from-purple-700 hover:to-blue-700"
                                        )}
                                    >
                                        {isUpdating ? "Updating Collection..." : "Update Collection"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
} 