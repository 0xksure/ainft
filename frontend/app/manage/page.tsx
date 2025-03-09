'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

interface AiNft {
    id: string;
    name: string;
    imageUrl: string;
    modelProvider: string;
    dateCreated: Date;
}

export default function ManagePage() {
    const wallet = useWallet();
    const { selectedNetwork } = useNetworkStore();
    const program = useAnchorProgram();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock data for AI NFTs
    const [aiNfts, setAiNfts] = useState<AiNft[]>([
        {
            id: '1',
            name: 'Code Assistant',
            imageUrl: '/code-assistant.png',
            modelProvider: 'OpenAI',
            dateCreated: new Date('2023-06-15T00:00:00Z'),
        },
        {
            id: '2',
            name: 'Creative Writer',
            imageUrl: '/creative-writer.png',
            modelProvider: 'Anthropic',
            dateCreated: new Date('2023-07-22T00:00:00Z'),
        },
        {
            id: '3',
            name: 'Data Analyst',
            imageUrl: '/data-analyst.png',
            modelProvider: 'OpenAI',
            dateCreated: new Date('2023-08-10T00:00:00Z'),
        },
    ]);

    // In a real implementation, this would fetch the user's AI NFTs from the blockchain
    const fetchAiNfts = async () => {
        if (!wallet.connected) {
            setError('Please connect your wallet first');
            return;
        }

        if (!wallet.publicKey) {
            setError('Wallet public key not available');
            return;
        }

        if (!program) {
            setError('Program not initialized');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // This would be the actual call to fetch AI NFTs
            // const userAiNfts = await program.account.aiNft.all([
            //   {
            //     memcmp: {
            //       offset: 8, // After discriminator
            //       bytes: wallet.publicKey!.toBase58(),
            //     },
            //   },
            // ]);

            console.log('Would fetch AI NFTs for wallet:', wallet.publicKey?.toString());

            // For now, we're using mock data
            // In a real implementation, we would update the state with the fetched data
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);

        } catch (err) {
            console.error('Error fetching AI NFTs:', err);
            setError(`Error fetching AI NFTs: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
        }
    };

    return (
        <PageLayout>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex justify-between items-center mb-6"
                >
                    <h1 className="text-3xl font-bold">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                            Manage AI NFTs
                        </span>
                    </h1>
                    <Button
                        onClick={fetchAiNfts}
                        disabled={isLoading || !wallet.connected}
                        className={isLoading ? "opacity-70 cursor-not-allowed" : ""}
                    >
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                </motion.div>

                {!wallet.connected ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-6"
                    >
                        <p className="text-yellow-300">Please connect your wallet to manage your AI NFTs.</p>
                    </motion.div>
                ) : null}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6"
                    >
                        <p className="text-red-300">{error}</p>
                    </motion.div>
                )}

                {wallet.connected && aiNfts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-700 text-center"
                    >
                        <h2 className="text-xl font-semibold mb-2">No AI NFTs Found</h2>
                        <p className="text-gray-400 mb-6">You don't have any AI NFTs yet. Mint one to get started!</p>
                        <Button asChild>
                            <a href="/mint">Mint AI NFT</a>
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {aiNfts.map((nft) => (
                            <motion.div key={nft.id} variants={itemVariants}>
                                <Card className="h-full overflow-hidden group">
                                    <div className="h-48 bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                        <motion.div
                                            initial={{ scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute inset-0 w-full h-full"
                                        >
                                            <div
                                                className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                                                style={{ backgroundImage: `url(${nft.imageUrl})` }}
                                            />
                                        </motion.div>
                                        <span className="text-2xl font-bold relative z-10 text-white drop-shadow-lg">{nft.name}</span>
                                    </div>

                                    <CardHeader>
                                        <CardTitle>{nft.name}</CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="space-y-2 mb-4">
                                            <p className="text-sm text-gray-300">
                                                <span className="text-gray-400">Model Provider:</span> {nft.modelProvider}
                                            </p>
                                            <p className="text-sm text-gray-300">
                                                <span className="text-gray-400">Created:</span>{' '}
                                                {nft.dateCreated.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-300">
                                                <span className="text-gray-400">ID:</span> {nft.id}
                                            </p>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex space-x-2">
                                        <Button asChild variant="default" className="flex-1">
                                            <a href={`/chat?address=${nft.id}`}>Chat</a>
                                        </Button>
                                        <Button variant="secondary" className="flex-1">
                                            Edit
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </PageLayout>
    );
} 