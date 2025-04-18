'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import {
    useAnchorProgram,
    premintNft,
    fetchCollections,
    fetchCharacterConfigs
} from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { getExplorerUrl, getExplorerName } from '../utils/explorer';

export default function PremintNftPage() {
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const router = useRouter();

    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // Collection and Config state
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [characterConfigs, setCharacterConfigs] = useState<any[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<string>('');

    // NFT details state
    const [name, setName] = useState('');
    const [uri, setUri] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [price, setPrice] = useState(0.1); // SOL

    // Transaction state
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [nftMintAddress, setNftMintAddress] = useState<string | null>(null);
    const [aiCharacterAddress, setAiCharacterAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Image error state
    const [imageError, setImageError] = useState(false);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load collections and configs when wallet is connected
    useEffect(() => {
        if (program && wallet.publicKey && connection) {
            loadCollectionsAndConfigs();
        }
    }, [program, wallet.publicKey, connection]);

    // Load collections and configs
    const loadCollectionsAndConfigs = async () => {
        if (!program || !wallet.publicKey || !connection) return;

        setIsLoading(true);
        try {
            // Load collections owned by the user
            const userCollections = await fetchCollections(program, connection, wallet.publicKey);
            setCollections(userCollections);

            // Load character configs created by the user
            const userConfigs = await fetchCharacterConfigs(program, connection, wallet.publicKey);
            setCharacterConfigs(userConfigs);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load collections and configs. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle URL input and validation
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUri(value);

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

    // Handle collection change
    const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCollection(e.target.value);
    };

    // Handle config change
    const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedConfig(e.target.value);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!program || !wallet.publicKey) {
            setError("Program or wallet not connected");
            return;
        }

        if (!selectedCollection) {
            setError("Please select a collection");
            return;
        }

        try {
            setIsCreating(true);
            setError(null);

            // Find the collection details
            const collection = collections.find(c => c.publicKey.toString() === selectedCollection);
            if (!collection) {
                throw new Error('Selected collection not found');
            }

            // Convert price from SOL to lamports
            const priceLamports = Math.floor(price * 1_000_000_000);

            // Ensure connection is available
            if (!connection) {
                throw new Error('Connection is not available');
            }

            // Premint the NFT
            const result = await premintNft(
                program,
                wallet,
                connection,
                collection.name,
                name,
                uri,
                priceLamports,
                selectedConfig === '' ? undefined : selectedConfig
            );

            setTxHash(result.txId);
            setNftMintAddress(result.nftMintAddress.toString());
            setAiCharacterAddress(result.aiCharacterAddress.toString());

            // Reset form after success
            setTimeout(() => {
                setName('');
                setUri('');
                setPreviewUrl('');
                setPrice(0.1);
            }, 3000);

        } catch (err) {
            console.error('Error preminting NFT:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsCreating(false);
        }
    };

    // Only render wallet-dependent content on the client
    if (!isClient) {
        return (
            <PageLayout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Premint AI NFT</h1>
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
                    <h1 className="text-3xl font-bold mb-6">Premint AI NFT</h1>

                    {!wallet.publicKey ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Connect your wallet to premint an AI NFT</p>
                            <p>Please use the wallet button in the header to connect.</p>
                        </div>
                    ) : programLoading || isLoading ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Loading...</p>
                            <div className="animate-pulse h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                            <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ) : programError ? (
                        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Error loading program</p>
                            <p>{programError.message}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Success message */}
                            {txHash && nftMintAddress && aiCharacterAddress && (
                                <div className="md:col-span-2 bg-green-900/50 border border-green-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">AI NFT Preminted Successfully!</h2>
                                    <p className="mb-2">Your AI NFT has been preminted on the {network} network.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="font-semibold">NFT Mint Address:</p>
                                            <code className="bg-black/30 px-2 py-1 rounded break-all">{nftMintAddress}</code>
                                        </div>
                                        <div>
                                            <p className="font-semibold">AI Character Address:</p>
                                            <code className="bg-black/30 px-2 py-1 rounded break-all">{aiCharacterAddress}</code>
                                        </div>
                                    </div>
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
                                    <p className="mt-4">
                                        Users can now purchase this NFT from your collection. You can view all your preminted NFTs in the Manage Collections page.
                                    </p>
                                    <div className="mt-4 flex gap-4">
                                        <Link
                                            href="/manage-collections"
                                            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                                        >
                                            Manage Collections
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setTxHash(null);
                                                setNftMintAddress(null);
                                                setAiCharacterAddress(null);
                                            }}
                                            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Premint Another NFT
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <div className="md:col-span-2 bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">Error Preminting NFT</h2>
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* No collections warning */}
                            {collections.length === 0 && (
                                <div className="md:col-span-2 bg-yellow-900/50 border border-yellow-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">No Collections Found</h2>
                                    <p className="mb-4">You need to create a collection before you can premint NFTs.</p>
                                    <Link
                                        href="/create-collection"
                                        className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 transition-colors inline-block"
                                    >
                                        Create a Collection
                                    </Link>
                                </div>
                            )}

                            {/* Premint Form */}
                            {collections.length > 0 && (
                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h2 className="text-2xl font-semibold mb-4">Premint an AI NFT</h2>
                                    <p className="text-gray-400 mb-6">
                                        Create an NFT in your collection that users can purchase. You can optionally link it to a character configuration.
                                    </p>
                                    <form className="space-y-6" onSubmit={handleSubmit}>
                                        <div>
                                            <label className="block mb-2">Collection</label>
                                            <select
                                                value={selectedCollection}
                                                onChange={handleCollectionChange}
                                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Select a collection</option>
                                                {collections.map((collection) => (
                                                    <option key={collection.publicKey.toString()} value={collection.publicKey.toString()}>
                                                        {collection.name} ({collection.mintCount?.toString() || '0'}/{collection.totalSupply?.toString() || 'unlimited'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block mb-2">Character Configuration (Optional)</label>
                                            <select
                                                value={selectedConfig}
                                                onChange={handleConfigChange}
                                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="">No character configuration</option>
                                                {characterConfigs.map((config) => (
                                                    <option key={config.publicKey.toString()} value={config.publicKey.toString()}>
                                                        {config.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Link this NFT to a character configuration or leave blank to allow the owner to choose later
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block mb-2">NFT Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                placeholder="Enter a name for your NFT"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2">NFT Image URL</label>
                                            <input
                                                type="text"
                                                value={uri}
                                                onChange={handleUrlChange}
                                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                placeholder="https://example.com/your-nft-image.jpg"
                                                required
                                            />
                                            <p className="text-sm text-gray-400 mt-1">
                                                Enter the URL for your NFT's image
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block mb-2">Price (SOL)</label>
                                            <input
                                                type="number"
                                                value={price}
                                                onChange={(e) => setPrice(parseFloat(e.target.value))}
                                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                placeholder="Price in SOL"
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                            <p className="text-sm text-gray-400 mt-1">
                                                The price users will pay to purchase this NFT
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isCreating || collections.length === 0}
                                            className={cn(
                                                "w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
                                                (isCreating || collections.length === 0) ? "opacity-70 cursor-not-allowed" : "hover:from-purple-700 hover:to-blue-700"
                                            )}
                                        >
                                            {isCreating ? "Preminting NFT..." : "Premint NFT"}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Preview */}
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Preview</h2>
                                <div className="aspect-square bg-gray-700 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                                    {previewUrl ? (
                                        <div className="relative w-full h-full">
                                            {!imageError ? (
                                                <Image
                                                    src={previewUrl}
                                                    alt={name || "NFT Image"}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    onError={handleImageError}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                                    <p className="text-gray-400 mb-2">URL entered but image couldn't be displayed</p>
                                                    <div className="bg-gray-900 p-3 rounded-md w-full max-w-xs overflow-hidden">
                                                        <p className="text-xs text-gray-400 truncate">{previewUrl}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center p-8">
                                            <p className="text-gray-400">Enter a valid URL to see a preview</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-900/30 rounded-lg">
                                        <h3 className="font-semibold mb-2">What is Preminting?</h3>
                                        <p className="text-sm text-gray-300">
                                            Preminting creates NFTs in your collection that users can purchase. These NFTs can be configured with AI character settings.
                                            Once preminted, they'll be available for sale in your collection until purchased.
                                        </p>
                                    </div>

                                    {selectedCollection && collections.length > 0 && (
                                        <div className="p-4 bg-purple-900/30 rounded-lg">
                                            <h3 className="font-semibold mb-2">Selected Collection</h3>
                                            {(() => {
                                                const collection = collections.find(c => c.publicKey.toString() === selectedCollection);
                                                return collection ? (
                                                    <div>
                                                        <p><span className="font-semibold">Name:</span> {collection.name}</p>
                                                        <p><span className="font-semibold">Symbol:</span> {collection.symbol}</p>
                                                        <p><span className="font-semibold">Minted:</span> {collection.mintCount?.toString() || '0'}/{collection.totalSupply?.toString() || 'unlimited'}</p>
                                                        <p><span className="font-semibold">Default Price:</span> {(collection.mintPrice?.toString() || '0') / 1_000_000_000} SOL</p>
                                                    </div>
                                                ) : <p>Collection details not found</p>;
                                            })()}
                                        </div>
                                    )}

                                    {selectedConfig && characterConfigs.length > 0 && (
                                        <div className="p-4 bg-green-900/30 rounded-lg">
                                            <h3 className="font-semibold mb-2">Selected Character Config</h3>
                                            {(() => {
                                                const config = characterConfigs.find(c => c.publicKey.toString() === selectedConfig);
                                                return config ? (
                                                    <div>
                                                        <p><span className="font-semibold">Name:</span> {config.name}</p>
                                                        <p><span className="font-semibold">Model:</span> {config.modelProvider}</p>
                                                        <p><span className="font-semibold">Voice:</span> {config.settings.voice.model}</p>
                                                    </div>
                                                ) : <p>Config details not found</p>;
                                            })()}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <p className="font-semibold">Network: {network}</p>
                                        <p className="text-sm text-gray-400">
                                            Preminting an NFT will cost approximately 0.01 SOL in transaction fees.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </PageLayout>
    );
} 