'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';

export default function MintPage() {
    const { publicKey } = useWallet();
    const { network, connection } = useNetworkStore();
    const [isClient, setIsClient] = useState(false);

    const program = useAnchorProgram();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [clients, setClients] = useState(['']);
    const [modelProvider, setModelProvider] = useState('');
    const [voiceModel, setVoiceModel] = useState('');
    const [bio, setBio] = useState(['']);
    const [lore, setLore] = useState(['']);
    const [knowledge, setKnowledge] = useState(['']);
    const [topics, setTopics] = useState(['']);
    const [adjectives, setAdjectives] = useState(['']);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Helper function to update array fields
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

    // Helper function to add item to array fields
    const addArrayItem = (
        array: string[],
        setArray: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setArray([...array, '']);
    };

    // Helper function to remove item from array fields
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!publicKey) {
            setError('Wallet not connected');
            return;
        }

        if (!program) {
            setError('Program not initialized');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Filter out empty strings from arrays
            const filteredClients = clients.filter(item => item.trim() !== '');
            const filteredBio = bio.filter(item => item.trim() !== '');
            const filteredLore = lore.filter(item => item.trim() !== '');
            const filteredKnowledge = knowledge.filter(item => item.trim() !== '');
            const filteredTopics = topics.filter(item => item.trim() !== '');
            const filteredAdjectives = adjectives.filter(item => item.trim() !== '');

            // Create config object
            const config = {
                name,
                clients: filteredClients,
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
                style: {}, // This would be populated with actual style data
                adjectives: filteredAdjectives,
            };

            // For now, just log the config
            console.log('Creating AI NFT with config:', config);

            // This would be the actual call to create the AI NFT
            // const txId = await createAiNft(program, publicKey!, config);

            setSuccess('AI NFT created successfully! Transaction ID: [placeholder]');
        } catch (err) {
            console.error('Error creating AI NFT:', err);
            setError(`Error creating AI NFT: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoading(false);
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
                <h1 className="text-3xl font-bold mb-6">Mint Your AI NFT</h1>

                {!publicKey ? (
                    <div className="bg-gray-800 p-6 rounded-lg mb-8">
                        <p className="text-xl mb-4">Connect your wallet to mint an AI NFT</p>
                        <p>Please use the wallet button in the header to connect.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mint Form */}
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-2xl font-semibold mb-4">Create Your AI NFT</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block mb-2">AI Character Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter a name for your AI"
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
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2">Upload Image</label>
                                    <div className="border-2 border-dashed border-gray-600 p-4 rounded text-center">
                                        <p>Drag and drop an image or click to browse</p>
                                        <button type="button" className="mt-2 px-4 py-2 bg-gray-700 rounded">Browse Files</button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                                >
                                    {isLoading ? 'Minting...' : 'Mint NFT'}
                                </button>
                            </form>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-2xl font-semibold mb-4">Preview</h2>
                            <div className="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                                <p className="text-gray-400">Image preview will appear here</p>
                            </div>
                            <div className="space-y-2">
                                <p className="font-semibold">Network: {network}</p>
                                <p className="font-semibold">Wallet: {publicKey.toString()}</p>
                                <p className="text-sm text-gray-400">
                                    Minting an AI NFT will cost approximately 0.01 SOL in transaction fees.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
} 