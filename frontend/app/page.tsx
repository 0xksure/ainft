'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import PageLayout from './components/PageLayout';
import { cn } from './components/ui/utils';
import { ArrowRight, Brain, MessageSquare, Edit, Cpu } from 'lucide-react';

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

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <PageLayout>
            {/* Hero Section */}
            <section className="relative">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

                <div className="container mx-auto px-4 py-20 md:py-32">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="text-4xl md:text-6xl font-bold mb-6"
                        >
                            Create, Own, and Chat with{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                                AI NFTs
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-xl text-gray-300 mb-8"
                        >
                            Mint your own AI characters as NFTs on Solana. Customize their personality, knowledge, and behavior.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link
                                href="/mint"
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center"
                            >
                                Create AI NFT <ArrowRight size={18} className="ml-2" />
                            </Link>

                            <Link
                                href="/chat"
                                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center justify-center"
                            >
                                Chat with AI NFT <MessageSquare size={18} className="ml-2" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-black/50 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold text-center mb-12"
                    >
                        Key Features
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<Brain size={24} className="text-white" />}
                            title="Customizable AI"
                            description="Create AI characters with unique personalities, knowledge, and capabilities tailored to your needs."
                            delay={0.1}
                        />

                        <FeatureCard
                            icon={<MessageSquare size={24} className="text-white" />}
                            title="Interactive Chat"
                            description="Engage in natural conversations with your AI NFTs through a user-friendly chat interface."
                            delay={0.2}
                        />

                        <FeatureCard
                            icon={<Edit size={24} className="text-white" />}
                            title="Full Ownership"
                            description="Own your AI characters as NFTs on the Solana blockchain with full control over their development."
                            delay={0.3}
                        />

                        <FeatureCard
                            icon={<Cpu size={24} className="text-white" />}
                            title="Execution Clients"
                            description="Run your own execution client to process AI interactions and earn rewards for computation."
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                            className="text-3xl font-bold mb-6"
                        >
                            Ready to Create Your AI NFT?
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="text-xl text-gray-300 mb-8"
                        >
                            Join the future of AI ownership on the Solana blockchain.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            <Link
                                href="/mint"
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center"
                            >
                                Get Started <ArrowRight size={18} className="ml-2" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
} 