'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import { useAnchorProgram, createAiNftCollection } from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import CopyableAddress from '../components/CopyableAddress';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function CreateCollectionPage() {
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const router = useRouter();

    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [uri, setUri] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [royaltyBasisPoints, setRoyaltyBasisPoints] = useState(500); // 5% default
    const [mintPrice, setMintPrice] = useState(0.1); // SOL
    const [totalSupply, setTotalSupply] = useState(100);

    // Transaction state
    const [isCreating, setIsCreating] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [collectionAddress, setCollectionAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Image error state
    const [imageError, setImageError] = useState(false);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!program || !wallet.publicKey) {
            setError("Program or wallet not connected");
            return;
        }

        try {
            setIsCreating(true);
            setError(null);

            // Convert mint price from SOL to lamports
            const mintPriceLamports = Math.floor(mintPrice * 1_000_000_000);

            // Create AI NFT Collection
            const result = await createAiNftCollection(
                program, 
                wallet, 
                connection, 
                name,
                symbol,
                uri,
                royaltyBasisPoints,
                mintPriceLamports,
                totalSupply
            );

            setTxHash(result.txId);
            setCollectionAddress(result.collectionAddress.toString());

            // Reset form
            setName('');
            setSymbol('');
            setUri('');
            setPreviewUrl('');
            setRoyaltyBasisPoints(500);
            setMintPrice(0.1);
            setTotalSupply(100);

            // Redirect to manage collections page after a short delay
            setTimeout(() => {
                router.push('/manage-collections');
            }, 3000);

        } catch (err) {
            console.error('Error creating AI NFT Collection:', err);
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
                    <h1 className="text-3xl font-bold mb-6">Create AI NFT Collection</h1>
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
                    <h1 className="text-3xl font-bold mb-6">Create AI NFT Collection</h1>

                    {!wallet.publicKey ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Connect your wallet to create an AI NFT Collection</p>
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
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Success message */}
                            {txHash && collectionAddress && (
                                <div className="md:col-span-2 bg-green-900/50 border border-green-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">AI NFT Collection Created Successfully!</h2>
                                    <p className="mb-2">Your AI NFT Collection has been created on the {network} network.</p>
                                    <p className="mb-4">
                                        <span className="font-semibold">Collection Address:</span>{' '}
                                        <code className="bg-black/30 px-2 py-1 rounded">{collectionAddress}</code>
                                    </p>
                                    <p>
                                        <span className="font-semibold">Transaction:</span>{' '}
                                        <a
                                            href={`https://explorer.solana.com/tx/${txHash}?cluster=${network}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline"
                                        >
                                            View on Solana Explorer
                                        </a>
                                    </p>
                                    <p className="mt-4">
                                        Redirecting you to the manage collections page where you can premint NFTs for your collection...
                                    </p>
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <div className="md:col-span-2 bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">Error Creating AI NFT Collection</h2>
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Collection Form */}
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Create Your AI NFT Collection</h2>
                                <p className="text-gray-400 mb-6">
                                    Enter details for your AI NFT Collection. After creating the collection, you can premint NFTs for users to purchase.
                                </p>
                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block mb-2">Collection Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter a name for your collection"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Collection Symbol</label>
                                        <input
                                            type="text"
                                            value={symbol}
                                            onChange={(e) => setSymbol(e.target.value)}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Symbol (e.g., AINFT)"
                                            required
                                            maxLength={10}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Collection Image URL</label>
                                        <input
                                            type="text"
                                            value={uri}
                                            onChange={handleUrlChange}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="https://example.com/your-collection-image"
                                            required
                                        />
                                        <p className="text-sm text-gray-400 mt-1">
                                            Enter the URL for your collection's image
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block mb-2">Royalty (%)</label>
                                        <input
                                            type="number"
                                            value={royaltyBasisPoints / 100}
                                            onChange={(e) => setRoyaltyBasisPoints(Math.min(100, Math.max(0, parseFloat(e.target.value) * 100)))}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Royalty percentage"
                                            required
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                        <p className="text-sm text-gray-400 mt-1">
                                            Percentage of secondary sales you'll receive as royalties
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block mb-2">Mint Price (SOL)</label>
                                        <input
                                            type="number"
                                            value={mintPrice}
                                            onChange={(e) => setMintPrice(parseFloat(e.target.value))}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Mint price in SOL"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Total Supply</label>
                                        <input
                                            type="number"
                                            value={totalSupply}
                                            onChange={(e) => setTotalSupply(parseInt(e.target.value))}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Total number of NFTs in collection"
                                            required
                                            min="1"
                                            step="1"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className={cn(
                                            "w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
                                            isCreating ? "opacity-70 cursor-not-allowed" : "hover:from-purple-700 hover:to-blue-700"
                                        )}
                                    >
                                        {isCreating ? "Creating Collection..." : "Create Collection"}
                                    </button>
                                </form>
                            </div>

                            {/* Preview */}
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Preview</h2>
                                <div className="aspect-square bg-gray-700 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                                    {previewUrl ? (
                                        <div className="relative w-full h-full">
                                            {!imageError ? (
                                                <Image
                                                    src={previewUrl}
                                                    alt={name || "Collection Image"}
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
                                        <h3 className="font-semibold mb-2">Collection Launchpad</h3>
                                        <p className="text-sm text-gray-300">
                                            After creating your collection, you'll be able to premint NFTs that users can purchase.
                                            Each NFT can be configured with different AI character settings and execution clients.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-semibold">Network: {network}</p>
                                        <div className="font-semibold">Wallet: <CopyableAddress address={wallet.publicKey} /></div>
                                        <p className="text-sm text-gray-400">
                                            Creating a collection will cost approximately 0.02 SOL in transaction fees.
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
