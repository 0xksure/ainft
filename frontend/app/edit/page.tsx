'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import { PublicKey, Connection, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { 
    useAnchorProgram, 
    findAppAinftPDA, 
    findAiCharacterMintPDA, 
    findAiCharacterPDA, 
    stringToByteArray,
    fetchAllExecutionClients,
    updateAiCharacterExecutionClient,
    getAiCharacterComputeTokenBalance,
    checkAiCharacterComputeAccount
} from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ExternalLink, Save, AlertCircle, Crown, Server } from 'lucide-react';
import Link from 'next/link';
import { fetchAiCharacterNft } from '../utils/metadata';
import * as anchor from '@coral-xyz/anchor';
import { useToast } from '../components/ui/toast';
import CopyableAddress from '../components/CopyableAddress';

interface AiCharacterConfig {
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
        tone: string;
        writing: string;
    };
    adjectives: string[];
}

// Execution client interface
interface ExecutionClientData {
    publicKey: PublicKey;
    aiNft: PublicKey;
    authority: PublicKey;
    computeTokenAddress: PublicKey;
    gas: number;
    computeMint: PublicKey;
    liquidStakingTokenMint: PublicKey;
    stakePoolTokenAccount: PublicKey;
    totalCompute: number;
    totalStaked: number;
    totalProcessed: number;
    stakerFeeShare: number;
    active: boolean;
    supportedMessageTypes: string[];
}

interface AiCharacterNft {
    address: string;
    name: string;
    characterConfig: AiCharacterConfig;
    owner: PublicKey;
    imageUrl: string;
    executionClient?: PublicKey;
    hasComputeAccount?: boolean;
    computeTokenBalance?: number;
}

export default function EditPage() {
    const searchParams = useSearchParams();
    const wallet = useWallet() as WalletContextState;
    const { publicKey } = wallet;
    const { program, loading: programLoading } = useAnchorProgram();
    const { network, connection } = useNetworkStore();
    const [isClient, setIsClient] = useState(false);
    const [nft, setNft] = useState<AiCharacterNft | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<AiCharacterConfig | null>(null);
    const [formKey, setFormKey] = useState(0);
    const { addToast } = useToast();
    
    // Execution client state
    const [executionClients, setExecutionClients] = useState<ExecutionClientData[]>([]);
    const [selectedExecutionClient, setSelectedExecutionClient] = useState<string | undefined>(undefined);
    const [loadingClients, setLoadingClients] = useState(false);
    const [updatingExecutionClient, setUpdatingExecutionClient] = useState(false);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    // Fetch execution clients
    const fetchExecutionClients = useCallback(async () => {
        if (!program || !connection || !wallet.publicKey) return;
        
        setLoadingClients(true);
        try {
            const clients = await fetchAllExecutionClients(program, connection);
            setExecutionClients(clients);
            
            // If we have an AI NFT and it has an execution client, set it as selected
            if (nft && nft.executionClient) {
                setSelectedExecutionClient(nft.executionClient.toString());
            }
        } catch (error) {
            console.error("Error fetching execution clients:", error);
            addToast("Failed to fetch execution clients", "error");
        } finally {
            setLoadingClients(false);
        }
    }, [program, connection, wallet.publicKey, nft, addToast]);
    
    // Load execution clients
    useEffect(() => {
        if (!isClient || !program || !connection) return;

        fetchExecutionClients();
    }, [isClient, program, connection, fetchExecutionClients]);

    // Fetch NFT data
    useEffect(() => {
        if (!isClient || !program || !connection || !searchParams) return;

        const nftAddress = searchParams.get('address');
        if (!nftAddress) return;

        const fetchNft = async () => {
            try {
                const nftData = await fetchAiCharacterNft(program, connection, nftAddress);
                console.log("Fetched NFT data:", nftData);
                
                // Check if the AI character has a compute account
                const hasComputeAccount = await checkAiCharacterComputeAccount(
                    connection,
                    nftData.executionClient
                );
                
                // Get compute token balance if the character has a compute account
                let computeTokenBalance = 0;
                if (hasComputeAccount) {
                    computeTokenBalance = await getAiCharacterComputeTokenBalance(
                        connection,
                        nftData.executionClient
                    );
                }
                
                // Add compute account info to nftData
                const updatedNftData = {
                    ...nftData,
                    hasComputeAccount,
                    computeTokenBalance
                };
                
                setNft(updatedNftData);
                
                // Initialize edit form with NFT data
                const formData = {
                    name: nftData.name || '',
                    clients: nftData.characterConfig.clients || [],
                    modelProvider: nftData.characterConfig.modelProvider || '',
                    settings: {
                        voice: {
                            model: nftData.characterConfig.settings.voice.model || '',
                        },
                    },
                    bio: nftData.characterConfig.bio || [],
                    lore: nftData.characterConfig.lore || [],
                    knowledge: nftData.characterConfig.knowledge || [],
                    topics: nftData.characterConfig.topics || [],
                    style: {
                        tone: nftData.characterConfig.style.tone || '',
                        writing: nftData.characterConfig.style.writing || '',
                    },
                    adjectives: nftData.characterConfig.adjectives || [],
                };

                console.log("Setting form data:", formData);
                setEditForm(formData);
                setFormKey(prev => prev + 1);
            } catch (err) {
                console.error('Error fetching NFT:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch NFT data');
            }
        };

        fetchNft();
    }, [isClient, program, connection, publicKey, searchParams]);

    // Handle saving changes
    const saveChanges = async () => {
        if (!program || !connection || !wallet.publicKey || !nft || !editForm) return;
        
        setSaving(true);
        setError(null);
        
        try {
            // Update the AI character on-chain
            // This is a placeholder for the actual update logic
            console.log("Saving changes:", editForm);
            
            // If we have a selected execution client, update it
            if (selectedExecutionClient) {
                try {
                    const selectedClient = executionClients.find(
                        client => client.publicKey.toString() === selectedExecutionClient
                    );
                    
                    if (selectedClient) {
                        const result = await updateAiCharacterExecutionClient(
                            program,
                            wallet,
                            connection,
                            new PublicKey(nft.address),
                            selectedClient.publicKey
                        );
                        
                        console.log("Updated execution client:", result);
                        
                        // Update the NFT data with the new execution client
                        setNft(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                executionClient: new PublicKey(selectedExecutionClient)
                            };
                        });
                        
                        addToast("Execution client updated successfully", "success");
                    }
                } catch (error) {
                    console.error("Error updating execution client:", error);
                    addToast("Failed to update execution client", "error");
                }
            }
            
            // Success message
            addToast("Changes saved successfully", "success");
            
            // Refresh the form
            setFormKey(prev => prev + 1);
        } catch (error) {
            console.error("Error saving changes:", error);
            setError(error instanceof Error ? error.message : 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // Handle updating the execution client
    const handleUpdateExecutionClient = async (clientPublicKey: string) => {
        if (!program || !connection || !wallet.publicKey || !nft) return;
        
        setUpdatingExecutionClient(true);
        try {
            // Just update the selected execution client state
            setSelectedExecutionClient(clientPublicKey);
        } catch (error) {
            console.error("Error updating execution client:", error);
            
            // Reset to previous selection
            if (nft.executionClient) {
                setSelectedExecutionClient(nft.executionClient.toString());
            } else {
                setSelectedExecutionClient(undefined);
            }
        } finally {
            setUpdatingExecutionClient(false);
        }
    };

    // Add a helper function to truncate addresses
    const truncateAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    if (!isClient) {
        return (
            <PageLayout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Loading...</h1>
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
                    {nft ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold">Edit NFT</h1>
                                    <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md text-sm">
                                        <Crown size={16} className="mr-1" />
                                        <span>Owner</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link
                                        href={`https://explorer.solana.com/address/${nft.address}?cluster=${network}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-blue-400 hover:text-blue-300"
                                    >
                                        View on Explorer <ExternalLink size={16} className="ml-1" />
                                    </Link>
                                    <Link
                                        href="/manage"
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                                    >
                                        Back to Manage
                                    </Link>
                                </div>
                            </div>

                            {/* Add owner address display below the title section */}
                            <div className="text-sm text-gray-400 mb-4">
                                Owner: <CopyableAddress address={nft.owner.toBase58()} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4">NFT Details</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Name</label>
                                            <Input
                                                key={`name-${formKey}`}
                                                value={editForm?.name || ''}
                                                onChange={(e) => {
                                                    console.log("Name changed:", e.target.value);
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, name: e.target.value };
                                                    });
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Model Provider</label>
                                            <Input
                                                key={`provider-${formKey}`}
                                                value={editForm?.modelProvider || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, modelProvider: e.target.value };
                                                    });
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Voice Model</label>
                                            <Input
                                                key={`voice-${formKey}`}
                                                value={editForm?.settings.voice.model || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return {
                                                            ...prev,
                                                            settings: {
                                                                ...prev.settings,
                                                                voice: { ...prev.settings.voice, model: e.target.value }
                                                            }
                                                        };
                                                    });
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4">Character Configuration</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Bio</label>
                                            <Textarea
                                                key={`bio-${formKey}`}
                                                value={editForm?.bio.join('\n') || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, bio: e.target.value.split('\n') };
                                                    });
                                                }}
                                                className="w-full min-h-[100px]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Lore</label>
                                            <Textarea
                                                key={`lore-${formKey}`}
                                                value={editForm?.lore.join('\n') || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, lore: e.target.value.split('\n') };
                                                    });
                                                }}
                                                className="w-full min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4">Knowledge & Topics</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Knowledge Areas</label>
                                            <Textarea
                                                key={`knowledge-${formKey}`}
                                                value={editForm?.knowledge.join('\n') || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, knowledge: e.target.value.split('\n') };
                                                    });
                                                }}
                                                className="w-full min-h-[100px]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Topics</label>
                                            <Textarea
                                                key={`topics-${formKey}`}
                                                value={editForm?.topics.join('\n') || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, topics: e.target.value.split('\n') };
                                                    });
                                                }}
                                                className="w-full min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4">Style & Personality</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Tone</label>
                                            <Input
                                                key={`tone-${formKey}`}
                                                value={editForm?.style.tone || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return {
                                                            ...prev,
                                                            style: { ...prev.style, tone: e.target.value }
                                                        };
                                                    });
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Writing Style</label>
                                            <Input
                                                key={`writing-${formKey}`}
                                                value={editForm?.style.writing || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return {
                                                            ...prev,
                                                            style: { ...prev.style, writing: e.target.value }
                                                        };
                                                    });
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Adjectives</label>
                                            <Textarea
                                                key={`adjectives-${formKey}`}
                                                value={editForm?.adjectives.join('\n') || ''}
                                                onChange={(e) => {
                                                    setEditForm(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, adjectives: e.target.value.split('\n') };
                                                    });
                                                }}
                                                className="w-full min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4">Execution Client</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Select Execution Client</label>
                                            <div className="flex flex-col space-y-2">
                                                {loadingClients ? (
                                                    <div className="animate-pulse h-10 bg-gray-700 rounded w-full"></div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center">
                                                            <select
                                                                value={selectedExecutionClient || ""}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    // Only update if a value is selected
                                                                    if (value) {
                                                                        handleUpdateExecutionClient(value);
                                                                    }
                                                                }}
                                                                disabled={updatingExecutionClient}
                                                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                                            >
                                                                <option value="">Select an execution client</option>
                                                                {executionClients.map((client) => (
                                                                    <option 
                                                                        key={client.publicKey.toString()} 
                                                                        value={client.publicKey.toString()}
                                                                    >
                                                                        {truncateAddress(client.publicKey.toString())} - Gas: {client.gas}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {selectedExecutionClient && (
                                                            <div className="flex items-center text-sm text-green-400">
                                                                <Server size={16} className="mr-2" />
                                                                Current client: <CopyableAddress address={selectedExecutionClient} className="text-green-400" />
                                                            </div>
                                                        )}
                                                        {updatingExecutionClient && (
                                                            <div className="text-sm text-blue-400">
                                                                Updating execution client...
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            The execution client handles the processing of messages sent to your AI character.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Compute Token Balance */}
                                        {nft && nft.hasComputeAccount && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium mb-1">Compute Token Balance</label>
                                                <div className={`flex items-center justify-between p-2 rounded ${
                                                    nft.computeTokenBalance !== undefined && nft.computeTokenBalance < 5
                                                        ? 'bg-red-900/70 text-red-200'
                                                        : 'bg-gray-700/50 text-blue-400'
                                                }`}>
                                                    <span className="text-sm">Available tokens:</span>
                                                    <span className="text-sm font-medium">
                                                        {nft.computeTokenBalance !== undefined ? `${nft.computeTokenBalance} tokens` : 'Loading...'}
                                                    </span>
                                                </div>
                                                {nft.computeTokenBalance !== undefined && nft.computeTokenBalance < 5 && (
                                                    <p className="text-xs text-red-400 mt-1">
                                                        Low token balance! Your AI character may not be able to process messages.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={saveChanges}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? 'Saving...' : (
                                        <>
                                            <Save size={16} />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <p>No NFT found</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </PageLayout>
    );
}