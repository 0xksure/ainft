'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import { useAnchorProgram, createAiNft, CharacterConfig } from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import CopyableAddress from '../components/CopyableAddress';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getExplorerUrl, getExplorerName } from '../utils/explorer';

export default function MintPage() {
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const router = useRouter();

    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    // Transaction state
    const [isCreating, setIsCreating] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [aiNftAddress, setAiNftAddress] = useState<string | null>(null);
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
        setUrl(value);

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

    // Clean and validate URL
    const cleanUrl = (urlString: string): string => {
        // Check for duplicated URLs (a common paste error)
        const urlRegex = /(https?:\/\/[^\s]+)(https?:\/\/[^\s]+)/;
        const match = urlString.match(urlRegex);

        if (match) {
            console.log('Detected duplicated URL, cleaning up');
            return match[1]; // Return just the first URL
        }

        return urlString;
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

            // Create character config with minimal required fields
            const characterConfig: CharacterConfig = {
                name,
                clients: [],
                modelProvider: 'openai', // Default provider
                settings: {
                    voice: {
                        model: 'eleven_labs_default',
                    },
                },
                bio: [],
                lore: [],
                knowledge: [],
                topics: [],
                style: {},
                adjectives: [],
            };

            // Create AI NFT
            const result = await createAiNft(program, wallet, connection, characterConfig, url);

            setTxHash(result.txId);
            setAiNftAddress(result.aiNftAddress.toString());

            // Reset form
            setName('');
            setUrl('');
            setPreviewUrl('');

            // Redirect to manage page after a short delay
            setTimeout(() => {
                router.push('/manage');
            }, 3000);

        } catch (err) {
            console.error('Error creating AI NFT:', err);
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
                    <h1 className="text-3xl font-bold mb-6">Mint Your AI NFT</h1>
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
                    <h1 className="text-3xl font-bold mb-6">Mint Your AI NFT</h1>

                    {!wallet.publicKey ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Connect your wallet to mint an AI NFT</p>
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
                            {txHash && aiNftAddress && (
                                <div className="md:col-span-2 bg-green-900/50 border border-green-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">AI NFT Created Successfully!</h2>
                                    <p className="mb-2">Your AI NFT has been created on the {network} network.</p>
                                    <p className="mb-4">
                                        <span className="font-semibold">AI NFT Address:</span>{' '}
                                        <code className="bg-black/30 px-2 py-1 rounded">{aiNftAddress}</code>
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
                                    <p className="mt-4">
                                        Redirecting you to the manage page where you can update and configure your AI NFT...
                                    </p>
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <div className="md:col-span-2 bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">Error Creating AI NFT</h2>
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Mint Form */}
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Create Your AI NFT</h2>
                                <p className="text-gray-400 mb-6">
                                    Enter a name and URL for your AI NFT. You can update all other settings after minting.
                                </p>
                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block mb-2">AI Character Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter a name for your AI"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">AI Character URL</label>
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={handleUrlChange}
                                            onPaste={(e) => {
                                                e.preventDefault(); // Prevent default paste behavior
                                                const pastedText = e.clipboardData.getData('text');

                                                // Clean the URL before setting it
                                                let cleanedUrl = pastedText;

                                                // Check for duplicated URLs
                                                const urlRegex = /(https?:\/\/[^\s]+?)(https?:\/\/)/;
                                                const match = pastedText.match(urlRegex);
                                                if (match) {
                                                    cleanedUrl = match[1];
                                                    console.log('Detected duplicated URL, cleaned to:', cleanedUrl);
                                                }

                                                // Set the cleaned URL
                                                setUrl(cleanedUrl);

                                                try {
                                                    new URL(cleanedUrl);
                                                    setPreviewUrl(cleanedUrl);
                                                    setImageError(false);
                                                } catch (err) {
                                                    console.log('Invalid URL pasted:', err);
                                                }
                                            }}
                                            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="https://example.com/your-ai-character"
                                            required
                                        />
                                        <p className="text-sm text-gray-400 mt-1">
                                            Enter the URL where your AI character is hosted
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className={cn(
                                            "w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
                                            isCreating ? "opacity-70 cursor-not-allowed" : "hover:from-purple-700 hover:to-blue-700"
                                        )}
                                    >
                                        {isCreating ? "Creating AI NFT..." : "Create AI NFT"}
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
                                                    alt={name || "AI Character"}
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
                                        <h3 className="font-semibold mb-2">Update Anytime</h3>
                                        <p className="text-sm text-gray-300">
                                            You can update your AI NFT's configuration at any time after minting.
                                            Visit the manage page to customize your AI character's personality, knowledge,
                                            and other settings.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-semibold">Network: {network}</p>
                                        <div className="font-semibold">Wallet: <CopyableAddress address={wallet.publicKey} /></div>
                                        <p className="text-sm text-gray-400">
                                            Creating an AI NFT will cost approximately 0.01 SOL in transaction fees.
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