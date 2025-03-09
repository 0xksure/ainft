'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import PageLayout from './components/PageLayout';
import { Button } from './components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';

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

export default function Home() {
    return (
        <PageLayout>
            {/* Hero Section */}
            <section className="py-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <h1 className="text-5xl font-bold mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                            AI NFT Platform
                        </span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-xl mb-8 max-w-3xl mx-auto text-gray-300"
                >
                    Mint, own, and interact with unique AI characters on the Solana blockchain.
                    Each AI NFT comes with its own personality and capabilities.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-4 mb-16"
                >
                    <Link href="/mint">
                        <Button size="lg" className="group">
                            Mint AI NFT
                            <motion.span
                                initial={{ width: 0 }}
                                whileHover={{ width: '100%' }}
                                className="absolute bottom-0 left-0 h-0.5 bg-white/30"
                            />
                        </Button>
                    </Link>

                    <Link href="/manage">
                        <Button variant="secondary" size="lg">
                            Manage NFTs
                        </Button>
                    </Link>

                    <Link href="/chat">
                        <Button variant="secondary" size="lg">
                            Chat with AI
                        </Button>
                    </Link>

                    <Link href="/execution-client">
                        <Button variant="secondary" size="lg">
                            Register Execution Client
                        </Button>
                    </Link>
                </motion.div>
            </section>

            {/* Featured AI Characters Section */}
            <section className="py-12">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-3xl font-bold mb-8 text-center"
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                        Featured AI Characters
                    </span>
                </motion.h2>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* Code Assistant Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="h-full overflow-hidden group">
                            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center relative overflow-hidden">
                                <motion.div
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    <div className="absolute inset-0 bg-[url('/code-assistant.png')] bg-cover bg-center opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                                </motion.div>
                                <span className="text-2xl font-bold relative z-10 text-white drop-shadow-lg">Code Assistant</span>
                            </div>

                            <CardHeader>
                                <CardTitle>Code Assistant</CardTitle>
                                <CardDescription>Expert in programming and software development</CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge>Programming</Badge>
                                    <Badge>Problem Solving</Badge>
                                    <Badge>Code Review</Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Get help with coding tasks, debugging, and software architecture. Your AI programming partner.
                                </p>
                            </CardContent>

                            <CardFooter>
                                <Button className="w-full">Use Template</Button>
                            </CardFooter>
                        </Card>
                    </motion.div>

                    {/* Creative Writer Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="h-full overflow-hidden group">
                            <div className="h-48 bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
                                <motion.div
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    <div className="absolute inset-0 bg-[url('/creative-writer.png')] bg-cover bg-center opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                                </motion.div>
                                <span className="text-2xl font-bold relative z-10 text-white drop-shadow-lg">Creative Writer</span>
                            </div>

                            <CardHeader>
                                <CardTitle>Creative Writer</CardTitle>
                                <CardDescription>Specialized in creative writing and storytelling</CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge>Writing</Badge>
                                    <Badge>Storytelling</Badge>
                                    <Badge>Creativity</Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Craft compelling stories, develop characters, and explore creative writing with AI assistance.
                                </p>
                            </CardContent>

                            <CardFooter>
                                <Button className="w-full">Use Template</Button>
                            </CardFooter>
                        </Card>
                    </motion.div>

                    {/* Data Analyst Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="h-full overflow-hidden group">
                            <div className="h-48 bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center relative overflow-hidden">
                                <motion.div
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    <div className="absolute inset-0 bg-[url('/data-analyst.png')] bg-cover bg-center opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                                </motion.div>
                                <span className="text-2xl font-bold relative z-10 text-white drop-shadow-lg">Data Analyst</span>
                            </div>

                            <CardHeader>
                                <CardTitle>Data Analyst</CardTitle>
                                <CardDescription>Expert in data analysis and visualization</CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge>Data Analysis</Badge>
                                    <Badge>Statistics</Badge>
                                    <Badge>Visualization</Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Transform raw data into insights with advanced analysis techniques and visualization tools.
                                </p>
                            </CardContent>

                            <CardFooter>
                                <Button className="w-full">Use Template</Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </motion.div>
            </section>

            {/* How It Works Section */}
            <section className="py-12">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-3xl font-bold mb-12 text-center"
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                        How It Works
                    </span>
                </motion.h2>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    <motion.div variants={itemVariants} className="text-center">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
                            <div className="w-16 h-16 bg-sky-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold">1</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Mint Your AI NFT</h3>
                            <p className="text-gray-300">
                                Choose a template or create a custom AI character with unique traits and capabilities.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="text-center">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
                            <div className="w-16 h-16 bg-sky-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold">2</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Interact & Chat</h3>
                            <p className="text-gray-300">
                                Engage with your AI NFT through chat, getting responses based on its unique personality.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="text-center">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
                            <div className="w-16 h-16 bg-sky-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold">3</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Earn & Trade</h3>
                            <p className="text-gray-300">
                                Run an execution client to earn rewards or trade your AI NFTs on the marketplace.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* CTA Section */}
            <section className="py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="bg-gradient-to-r from-sky-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl p-12 border border-sky-800/50 text-center"
                >
                    <h2 className="text-3xl font-bold mb-4">Ready to Create Your AI NFT?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
                        Join the future of AI ownership on the Solana blockchain.
                    </p>
                    <Link href="/mint">
                        <Button size="lg" className="px-8">Get Started</Button>
                    </Link>
                </motion.div>
            </section>
        </PageLayout>
    );
} 