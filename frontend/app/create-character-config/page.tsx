'use client';

import { useState, useEffect } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import {
    useAnchorProgram,
    fetchCharacterConfigs,
    createCharacterConfig
} from '../utils/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import { getExplorerUrl, getExplorerName } from '../utils/explorer';
import Link from 'next/link';

// Character Config type
interface CharacterConfig {
    publicKey: PublicKey;
    name: string;
    clients: string[];
    modelProvider: string;
    settings: {
        voice: {
            model: string;
        };
    };
    bio: string[];
    lore: string[];
    knowledge: string[];
    topics: string[];
    style: {
        all: string[];
        chat: string[];
        post: string[];
    };
    adjectives: string[];
    authority: PublicKey;
    bump: number;
}

export default function CreateCharacterConfigPage() {
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const router = useRouter();

    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);

    // Character config list state
    const [characterConfigs, setCharacterConfigs] = useState<any[]>([]);
    const [loadingConfigs, setLoadingConfigs] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Transaction state
    const [isCreating, setIsCreating] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [configAddress, setConfigAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load character configs when wallet and program are ready
    useEffect(() => {
        if (isClient && wallet.publicKey && program && !programLoading) {
            loadCharacterConfigs();
        }
    }, [isClient, wallet.publicKey, program, programLoading]);

    // Load character configs
    const loadCharacterConfigs = async () => {
        if (!program || !connection || !wallet.publicKey) return;

        try {
            setLoadingConfigs(true);
            setError(null);

            // Fetch all configs for this wallet
            const configs = await fetchCharacterConfigs(program, connection, wallet.publicKey);
            console.log('Fetched configs:', configs);
            setCharacterConfigs(configs);
        } catch (err) {
            console.error('Error loading character configs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load character configs');
        } finally {
            setLoadingConfigs(false);
        }
    };

    // Only render wallet-dependent content on the client
    if (!isClient) {
        return (
            <PageLayout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Character Configurations</h1>
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
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Character Configurations</h1>
                        {wallet.publicKey && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded hover:from-purple-700 hover:to-blue-700 transition-colors"
                            >
                                Create New Config
                            </button>
                        )}
                    </div>

                    {!wallet.publicKey ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Connect your wallet to view and create character configurations</p>
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
                        <div className="space-y-8">
                            {/* Success message */}
                            {txHash && configAddress && (
                                <div className="bg-green-900/50 border border-green-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">Character Configuration Created Successfully!</h2>
                                    <p className="mb-2">Your character configuration has been created on the {network} network.</p>
                                    <p className="mb-4">
                                        <span className="font-semibold">Config Address:</span>{' '}
                                        <code className="bg-black/30 px-2 py-1 rounded">{configAddress}</code>
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
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                                    <h2 className="text-2xl font-semibold mb-4">Error</h2>
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Character Config List */}
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Your Character Configurations</h2>

                                {loadingConfigs ? (
                                    <div className="animate-pulse space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-gray-700 p-4 rounded-lg">
                                                <div className="h-5 bg-gray-600 rounded w-1/4 mb-3"></div>
                                                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                                                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : characterConfigs.length === 0 ? (
                                    <div className="bg-gray-700/50 p-8 rounded-lg text-center">
                                        <p className="text-xl mb-4">You don't have any character configurations yet</p>
                                        <p className="mb-6 text-gray-400">Create your first configuration to get started.</p>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded hover:from-purple-700 hover:to-blue-700 transition-colors"
                                        >
                                            Create New Config
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {characterConfigs.map((config) => (
                                            <div key={config.publicKey.toString()} className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-semibold mb-1">{config.name}</h3>
                                                        <p className="text-gray-400 mb-2">
                                                            Model Provider: {config.modelProvider}
                                                        </p>

                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                                                            {config.bio.length > 0 && (
                                                                <div>
                                                                    <span className="text-gray-400 text-sm">Bio:</span>
                                                                    <p className="text-sm">{config.bio.join(', ')}</p>
                                                                </div>
                                                            )}

                                                            {config.adjectives.length > 0 && (
                                                                <div>
                                                                    <span className="text-gray-400 text-sm">Adjectives:</span>
                                                                    <p className="text-sm">{config.adjectives.join(', ')}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <a
                                                            href={getExplorerUrl('address', config.publicKey.toString(), network)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300 text-sm"
                                                        >
                                                            View on Explorer
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Create Character Config Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-gray-800 rounded-lg w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-700 p-4">
                            <h2 className="text-xl font-bold">Create Character Configuration</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <CharacterConfigForm
                            wallet={wallet}
                            program={program}
                            connection={connection}
                            network={network}
                            onSuccess={(txId, address) => {
                                setTxHash(txId);
                                setConfigAddress(address);
                                setIsModalOpen(false);
                                loadCharacterConfigs(); // Reload the config list
                            }}
                            onError={(err) => setError(err)}
                        />
                    </div>
                </div>
            )}
        </PageLayout>
    );
}

// Character Config Form Component
interface CharacterConfigFormProps {
    wallet: any;
    program: any;
    connection: any;
    network: string;
    onSuccess: (txId: string, address: string) => void;
    onError: (error: string) => void;
}

function CharacterConfigForm({ wallet, program, connection, network, onSuccess, onError }: CharacterConfigFormProps) {
    // Form state
    const [name, setName] = useState('');
    const [modelProvider, setModelProvider] = useState('openai');
    const [voiceModel, setVoiceModel] = useState('eleven_labs_default');
    const [bio, setBio] = useState(['']);
    const [lore, setLore] = useState(['']);
    const [knowledge, setKnowledge] = useState(['']);
    const [topics, setTopics] = useState(['']);
    const [adjectives, setAdjectives] = useState(['']);
    const [clients, setClients] = useState(['']);

    // Transaction state
    const [isCreating, setIsCreating] = useState(false);

    // Helper function to update array fields
    const updateArrayField = (field: string[], index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const newField = [...field];
        newField[index] = value;
        setter(newField);
    };

    // Helper function to add new item to array fields
    const addArrayItem = (field: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (field.length < 5) { // Maximum 5 items as per the contract
            setter([...field, '']);
        }
    };

    // Helper function to remove item from array fields
    const removeArrayItem = (field: string[], index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (field.length > 1) {
            const newField = [...field];
            newField.splice(index, 1);
            setter(newField);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!program || !wallet.publicKey) {
            onError("Program or wallet not connected");
            return;
        }

        try {
            setIsCreating(true);

            // Filter out empty strings from array fields
            const filteredBio = bio.filter(item => item.trim() !== '');
            const filteredLore = lore.filter(item => item.trim() !== '');
            const filteredKnowledge = knowledge.filter(item => item.trim() !== '');
            const filteredTopics = topics.filter(item => item.trim() !== '');
            const filteredAdjectives = adjectives.filter(item => item.trim() !== '');
            const filteredClients = clients.filter(item => item.trim() !== '');

            // Create character config
            const result = await createCharacterConfig(
                program,
                wallet,
                connection,
                {
                    name,
                    modelProvider,
                    settings: {
                        voice: {
                            model: voiceModel,
                        },
                    },
                    bio: filteredBio,
                    lore: filteredLore,
                    knowledge: filteredKnowledge,
                    topics: filteredTopics,
                    adjectives: filteredAdjectives,
                    clients: filteredClients,
                    style: {
                        all: [[], [], [], [], []],
                        chat: [[], [], [], [], []],
                        post: [[], [], [], [], []],
                    },
                }
            );

            // Call success callback with the transaction ID and config address
            onSuccess(result.txId, result.configAddress.toString());

        } catch (err) {
            console.error('Error creating character config:', err);
            onError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div>
                    <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2">Character Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter a name for your character"
                                required
                                maxLength={32}
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Model Provider</label>
                            <select
                                value={modelProvider}
                                onChange={(e) => setModelProvider(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="google">Google</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2">Voice Model</label>
                            <select
                                value={voiceModel}
                                onChange={(e) => setVoiceModel(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="eleven_labs_default">ElevenLabs Default</option>
                                <option value="eleven_labs_male_1">ElevenLabs Male 1</option>
                                <option value="eleven_labs_female_1">ElevenLabs Female 1</option>
                                <option value="openai_alloy">OpenAI Alloy</option>
                                <option value="openai_echo">OpenAI Echo</option>
                                <option value="openai_fable">OpenAI Fable</option>
                                <option value="openai_onyx">OpenAI Onyx</option>
                                <option value="openai_nova">OpenAI Nova</option>
                                <option value="openai_shimmer">OpenAI Shimmer</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Execution Clients */}
                <div>
                    <h3 className="text-xl font-semibold mb-4">Clients</h3>
                    <p className="text-gray-400 mb-4">
                        Specify which platforms this character can operate on (e.g., Twitter, Discord) - up to 5
                    </p>
                    {clients.map((client, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                value={client}
                                onChange={(e) => updateArrayField(clients, index, e.target.value, setClients)}
                                className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Platform name (e.g., Twitter, Discord)"
                                maxLength={20}
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem(clients, index, setClients)}
                                className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                                disabled={clients.length <= 1}
                            >
                                -
                            </button>
                        </div>
                    ))}
                    {clients.length < 5 && (
                        <button
                            type="button"
                            onClick={() => addArrayItem(clients, setClients)}
                            className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                        >
                            Add Client
                        </button>
                    )}
                </div>

                {/* Character Personality */}
                <div>
                    <h3 className="text-xl font-semibold mb-4">Character Personality</h3>

                    {/* Bio */}
                    <div className="mb-6">
                        <label className="block mb-2">Bio (up to 5 entries)</label>
                        <p className="text-gray-400 mb-4">
                            Short biographical information about the character
                        </p>
                        {bio.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateArrayField(bio, index, e.target.value, setBio)}
                                    className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Bio information"
                                    maxLength={32}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(bio, index, setBio)}
                                    className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    disabled={bio.length <= 1}
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        {bio.length < 5 && (
                            <button
                                type="button"
                                onClick={() => addArrayItem(bio, setBio)}
                                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                Add Bio Entry
                            </button>
                        )}
                    </div>

                    {/* Lore */}
                    <div className="mb-6">
                        <label className="block mb-2">Lore (up to 5 entries)</label>
                        <p className="text-gray-400 mb-4">
                            Background story and world-building details
                        </p>
                        {lore.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateArrayField(lore, index, e.target.value, setLore)}
                                    className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Lore information"
                                    maxLength={32}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(lore, index, setLore)}
                                    className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    disabled={lore.length <= 1}
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        {lore.length < 5 && (
                            <button
                                type="button"
                                onClick={() => addArrayItem(lore, setLore)}
                                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                Add Lore Entry
                            </button>
                        )}
                    </div>

                    {/* Knowledge */}
                    <div className="mb-6">
                        <label className="block mb-2">Knowledge (up to 5 entries)</label>
                        <p className="text-gray-400 mb-4">
                            Specific knowledge areas this character specializes in
                        </p>
                        {knowledge.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateArrayField(knowledge, index, e.target.value, setKnowledge)}
                                    className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Knowledge area"
                                    maxLength={32}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(knowledge, index, setKnowledge)}
                                    className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    disabled={knowledge.length <= 1}
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        {knowledge.length < 5 && (
                            <button
                                type="button"
                                onClick={() => addArrayItem(knowledge, setKnowledge)}
                                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                Add Knowledge Entry
                            </button>
                        )}
                    </div>

                    {/* Topics */}
                    <div className="mb-6">
                        <label className="block mb-2">Topics (up to 5 entries)</label>
                        <p className="text-gray-400 mb-4">
                            Topics the character likes to discuss
                        </p>
                        {topics.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateArrayField(topics, index, e.target.value, setTopics)}
                                    className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Topic"
                                    maxLength={32}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(topics, index, setTopics)}
                                    className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    disabled={topics.length <= 1}
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        {topics.length < 5 && (
                            <button
                                type="button"
                                onClick={() => addArrayItem(topics, setTopics)}
                                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                Add Topic
                            </button>
                        )}
                    </div>

                    {/* Adjectives */}
                    <div className="mb-6">
                        <label className="block mb-2">Adjectives (up to 5 entries)</label>
                        <p className="text-gray-400 mb-4">
                            Personality traits and descriptive adjectives
                        </p>
                        {adjectives.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateArrayField(adjectives, index, e.target.value, setAdjectives)}
                                    className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Adjective"
                                    maxLength={32}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(adjectives, index, setAdjectives)}
                                    className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    disabled={adjectives.length <= 1}
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        {adjectives.length < 5 && (
                            <button
                                type="button"
                                onClick={() => addArrayItem(adjectives, setAdjectives)}
                                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                Add Adjective
                            </button>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isCreating}
                    className={cn(
                        "w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
                        isCreating ? "opacity-70 cursor-not-allowed" : "hover:from-purple-700 hover:to-blue-700"
                    )}
                >
                    {isCreating ? "Creating Configuration..." : "Create Character Configuration"}
                </button>
            </form>
        </div>
    );
}
