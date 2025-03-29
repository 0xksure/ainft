'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import { useAnchorProgram, createAiNft, CharacterConfig } from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import CopyableAddress from '../components/CopyableAddress';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';

export default function MintPage() {
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();

    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [bio, setBio] = useState<string[]>(['']);
    const [lore, setLore] = useState<string[]>(['']);
    const [knowledge, setKnowledge] = useState<string[]>(['']);
    const [topics, setTopics] = useState<string[]>(['']);
    const [adjectives, setAdjectives] = useState<string[]>(['']);
    const [modelProvider, setModelProvider] = useState('openai');
    const [voiceModel, setVoiceModel] = useState('eleven_labs_default');

    // Transaction state
    const [isCreating, setIsCreating] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [aiNftAddress, setAiNftAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Helper functions for array fields
    const updateArrayField = (
        index: number,
        value: string,
        array: string[],
        setArray: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        const newArray = [...array];
        newArray[index] = value;
        setArray(newArray);
    };

    const addArrayItem = (
        array: string[],
        setArray: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setArray([...array, '']);
    };

    const removeArrayItem = (
        index: number,
        array: string[],
        setArray: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (array.length <= 1) return;
        const newArray = [...array];
        newArray.splice(index, 1);
        setArray(newArray);
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

            // Add this before calling createAiNft
            console.log("Program:", program);
            console.log("Program methods:", program.methods);

            // Create character config
            const characterConfig: CharacterConfig = {
                name,
                clients: [],
                modelProvider,
                settings: {
                    voice: {
                        model: voiceModel,
                    },
                },
                bio: bio.filter(item => item.trim() !== ''),
                lore: lore.filter(item => item.trim() !== ''),
                knowledge: knowledge.filter(item => item.trim() !== ''),
                topics: topics.filter(item => item.trim() !== ''),
                style: {},
                adjectives: adjectives.filter(item => item.trim() !== ''),
            };

            // Create AI NFT
            const result = await createAiNft(program, wallet, connection, characterConfig);

            setTxHash(result.txId);
            setAiNftAddress(result.aiNftAddress.toString());

            // Reset form
            setName('');
            setDescription('');
            setBio(['']);
            setLore(['']);
            setKnowledge(['']);
            setTopics(['']);
            setAdjectives(['']);

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
                                            href={`https://explorer.solana.com/tx/${txHash}?cluster=${network}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline"
                                        >
                                            View on Solana Explorer
                                        </a>
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
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block mb-2">AI Character Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter a name for your AI"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            rows={4}
                                            placeholder="Describe your AI character's personality and capabilities"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Model Provider</label>
                                        <select
                                            value={modelProvider}
                                            onChange={(e) => setModelProvider(e.target.value)}
                                            className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="google">Google</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-2">Voice Model</label>
                                        <select
                                            value={voiceModel}
                                            onChange={(e) => setVoiceModel(e.target.value)}
                                            className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="eleven_labs_default">ElevenLabs Default</option>
                                            <option value="eleven_labs_male">ElevenLabs Male</option>
                                            <option value="eleven_labs_female">ElevenLabs Female</option>
                                        </select>
                                    </div>

                                    {/* Bio Fields */}
                                    <div>
                                        <label className="block mb-2">Bio</label>
                                        {bio.map((item, index) => (
                                            <div key={`bio-${index}`} className="flex mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateArrayField(index, e.target.value, bio, setBio)}
                                                    className="flex-1 p-2 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Add a bio detail"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(index, bio, setBio)}
                                                    className="px-3 bg-gray-600 hover:bg-gray-500 text-white"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addArrayItem(bio, setBio)}
                                                    className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-r"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Lore Fields */}
                                    <div>
                                        <label className="block mb-2">Lore</label>
                                        {lore.map((item, index) => (
                                            <div key={`lore-${index}`} className="flex mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateArrayField(index, e.target.value, lore, setLore)}
                                                    className="flex-1 p-2 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Add lore detail"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(index, lore, setLore)}
                                                    className="px-3 bg-gray-600 hover:bg-gray-500 text-white"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addArrayItem(lore, setLore)}
                                                    className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-r"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Knowledge Fields */}
                                    <div>
                                        <label className="block mb-2">Knowledge</label>
                                        {knowledge.map((item, index) => (
                                            <div key={`knowledge-${index}`} className="flex mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateArrayField(index, e.target.value, knowledge, setKnowledge)}
                                                    className="flex-1 p-2 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Add knowledge detail"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(index, knowledge, setKnowledge)}
                                                    className="px-3 bg-gray-600 hover:bg-gray-500 text-white"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addArrayItem(knowledge, setKnowledge)}
                                                    className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-r"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Topics Fields */}
                                    <div>
                                        <label className="block mb-2">Topics</label>
                                        {topics.map((item, index) => (
                                            <div key={`topics-${index}`} className="flex mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateArrayField(index, e.target.value, topics, setTopics)}
                                                    className="flex-1 p-2 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Add topic"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(index, topics, setTopics)}
                                                    className="px-3 bg-gray-600 hover:bg-gray-500 text-white"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addArrayItem(topics, setTopics)}
                                                    className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-r"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Adjectives Fields */}
                                    <div>
                                        <label className="block mb-2">Adjectives</label>
                                        {adjectives.map((item, index) => (
                                            <div key={`adjectives-${index}`} className="flex mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateArrayField(index, e.target.value, adjectives, setAdjectives)}
                                                    className="flex-1 p-2 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Add adjective"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(index, adjectives, setAdjectives)}
                                                    className="px-3 bg-gray-600 hover:bg-gray-500 text-white"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addArrayItem(adjectives, setAdjectives)}
                                                    className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-r"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className={cn(
                                            "w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
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
                                <div className="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className="text-2xl font-bold mb-2">{name || "AI Character Name"}</div>
                                        <p className="text-gray-400 mb-4">{description || "Character description will appear here"}</p>

                                        {bio[0] && (
                                            <div className="mb-3">
                                                <h3 className="text-sm font-semibold text-gray-400 mb-1">Bio</h3>
                                                <ul className="text-sm">
                                                    {bio.map((item, index) => (
                                                        item && <li key={index} className="mb-1">{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {adjectives[0] && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {adjectives.map((adj, index) => (
                                                    adj && (
                                                        <span key={index} className="px-2 py-1 bg-blue-900/50 rounded-full text-xs">
                                                            {adj}
                                                        </span>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-semibold">Network: {network}</p>
                                    <p className="font-semibold">Wallet: <CopyableAddress address={wallet.publicKey} /></p>
                                    <p className="text-sm text-gray-400">
                                        Creating an AI NFT will cost approximately 0.01 SOL in transaction fees.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </PageLayout>
    );
} 