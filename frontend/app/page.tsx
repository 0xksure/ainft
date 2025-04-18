'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import PageLayout from './components/PageLayout';
import { cn } from './components/ui/utils';
import { ArrowRight, Brain, Cpu, Edit, MessageSquare, Zap } from 'lucide-react';
import Link from 'next/link';

// Feature card component
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all"
    >
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
    </motion.div>
);

export default function Home() {
    const { publicKey } = useWallet();
    const [isClient, setIsClient] = useState(false);
    const [collectionName, setCollectionName] = useState('');
    const router = useRouter();

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (collectionName.trim()) {
            // Encode the collection name for URL safety
            const encodedName = encodeURIComponent(collectionName.trim());
            router.push(`/create-collection?name=${encodedName}`);
        }
    };

    return (
        <PageLayout>
            {/* Hero Section with Input Box */}
            <section className="relative min-h-[85vh] flex flex-col justify-center">
                {/* Background elements */}
                <div className="absolute inset-0 overflow-hidden -z-10">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none" />

                    {/* Animated grid effect */}
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }} />

                    {/* Decorative elements */}
                    <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl" />
                    <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl" />
                </div>

                <div className="container mx-auto px-4 z-10">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="text-center mb-12"
                        >
                            <h1 className="text-5xl md:text-7xl font-bold mb-4">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                                    AI NFT
                                </span>
                                <span className="ml-4">Launchpad</span>
                            </h1>
                            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                                Create, customize, and launch AI character NFTs on Solana.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-gray-800/60 backdrop-blur-md border border-gray-700 rounded-xl p-8 shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-center">Start by naming your collection</h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={collectionName}
                                        onChange={(e) => setCollectionName(e.target.value)}
                                        placeholder="Enter your collection name..."
                                        className="w-full p-4 pl-5 pr-12 bg-gray-900/80 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-xl"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <Zap className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center group"
                                >
                                    Create Collection
                                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>

                            <div className="mt-6 flex items-center justify-center">
                                <span className="text-gray-400 text-sm mr-3">Looking for existing collections?</span>
                                <Link href="/browse-nfts" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                    Browse AI NFTs
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-black/60 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold text-center mb-16"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                            Create AI NFTs in Minutes
                        </span>
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<Brain size={24} className="text-white" />}
                            title="AI Character Configs"
                            description="Define personalities, knowledge bases, and behaviors for your AI characters."
                            delay={0.1}
                        />

                        <FeatureCard
                            icon={<Cpu size={24} className="text-white" />}
                            title="NFT Collections"
                            description="Launch collections with custom royalties, pricing, and supply limits."
                            delay={0.2}
                        />

                        <FeatureCard
                            icon={<Edit size={24} className="text-white" />}
                            title="Premint & Sell"
                            description="Premint NFTs with unique AI configurations for your community to purchase."
                            delay={0.3}
                        />

                        <FeatureCard
                            icon={<MessageSquare size={24} className="text-white" />}
                            title="Interactive Companions"
                            description="Enable dynamic conversations and interactions with your AI characters."
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-gradient-to-b from-black to-purple-900/20">
                <div className="container mx-auto px-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold text-center mb-16"
                    >
                        Three Simple Steps
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-8"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6 text-xl font-bold">1</div>
                            <h3 className="text-xl font-bold mb-4">Name Your Collection</h3>
                            <p className="text-gray-300 mb-6">
                                Start by naming your AI NFT collection and setting properties like supply, royalties, and pricing.
                            </p>
                            <Link href="/create-collection" className="text-blue-400 hover:text-blue-300 font-medium flex items-center">
                                Get Started <ArrowRight size={16} className="ml-2" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-8"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6 text-xl font-bold">2</div>
                            <h3 className="text-xl font-bold mb-4">Configure AI Characters</h3>
                            <p className="text-gray-300 mb-6">
                                Create AI character configurations with unique personalities, knowledge bases, and behaviors.
                            </p>
                            <Link href="/create-character-config" className="text-blue-400 hover:text-blue-300 font-medium flex items-center">
                                Create Config <ArrowRight size={16} className="ml-2" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            viewport={{ once: true }}
                            className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-8"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6 text-xl font-bold">3</div>
                            <h3 className="text-xl font-bold mb-4">Premint & Launch</h3>
                            <p className="text-gray-300 mb-6">
                                Premint NFTs with your AI configurations for your community to purchase and interact with.
                            </p>
                            <Link href="/manage-collections" className="text-blue-400 hover:text-blue-300 font-medium flex items-center">
                                Manage Collections <ArrowRight size={16} className="ml-2" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
} 