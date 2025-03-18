'use client';

import { useEffect, useState } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import { PublicKey, Connection, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { useAnchorProgram } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ExternalLink, Save, AlertCircle, Crown } from 'lucide-react';
import Link from 'next/link';
import { fetchAiCharacterNft } from '../utils/metadata';
import * as anchor from '@coral-xyz/anchor';
import { findAppAinftPDA, findAiCharacterMintPDA, findAiCharacterPDA, stringToByteArray } from '../utils/anchor';

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

interface AiCharacterNft {
    address: string;
    name: string;
    characterConfig: AiCharacterConfig;
    owner: PublicKey;
    imageUrl: string;
}

export default function EditPage() {
    const searchParams = useSearchParams();
    const wallet = useWallet() as WalletContextState;
    const { publicKey } = wallet;
    const { program, loading: programLoading } = useAnchorProgram();
    const { network, connection } = useNetworkStore();
    const [isClient, setIsClient] = useState(false);
    const [nft, setNft] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<AiCharacterConfig | null>(null);
    const [formKey, setFormKey] = useState(0);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Fetch NFT data
    useEffect(() => {
        if (!isClient || !program || !connection || !searchParams) return;

        const nftAddress = searchParams.get('address');
        if (!nftAddress) return;

        const fetchNft = async () => {
            try {
                const nftData = await fetchAiCharacterNft(program, connection, nftAddress);
                console.log("Fetched NFT data:", nftData);
                setNft(nftData);

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

    const handleSave = async () => {
        if (!program || !nft || !editForm || !publicKey || !connection || !wallet || !wallet.signTransaction) {
            setError("Program, NFT, wallet or connection not available");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Find required PDAs and accounts
            const [appAinftPda] = findAppAinftPDA();
            const aiCharacter = new PublicKey(nft.address);
            const [aiCharacterMint] = findAiCharacterMintPDA(appAinftPda, nft.name);

            // Get the token account for the NFT owner
            const authorityAiCharacterTokenAccount = await anchor.utils.token.associatedAddress({
                mint: aiCharacterMint,
                owner: publicKey
            });

            // Create a batch of instructions
            const instructions = [];

            // Update name
            const updateNameIx = await program.methods
                .updateCharacterName(editForm.name)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateNameIx);

            // Update clients
            const updateClientsIx = await program.methods
                .updateCharacterClients(editForm.clients)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateClientsIx);

            // Update model provider
            const updateModelProviderIx = await program.methods
                .updateCharacterModelProvider(editForm.modelProvider)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateModelProviderIx);

            // Update voice settings
            // Convert string to byte array for voice model
            const voiceModel = stringToByteArray(editForm.settings.voice.model, 32);

            const updateVoiceSettingsIx = await program.methods
                .updateCharacterVoiceSettings(voiceModel)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateVoiceSettingsIx);

            // Update bio
            const updateBioIx = await program.methods
                .updateCharacterBio(editForm.bio)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateBioIx);

            // Update lore
            const updateLoreIx = await program.methods
                .updateCharacterLore(editForm.lore)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateLoreIx);

            // Update knowledge
            const updateKnowledgeIx = await program.methods
                .updateCharacterKnowledge(editForm.knowledge)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateKnowledgeIx);

            // Update topics
            const updateTopicsIx = await program.methods
                .updateCharacterTopics(editForm.topics)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateTopicsIx);

            // Update style all
            const styleAll = Array(10).fill(Array(32).fill(0)).map((_, i) => {
                const text = i === 0 ? editForm.style.tone :
                    i === 1 ? editForm.style.writing : '';
                return stringToByteArray(text, 32);
            });

            const updateStyleAllIx = await program.methods
                .updateCharacterStyleAll(styleAll)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateStyleAllIx);

            // Update adjectives
            const updateAdjectivesIx = await program.methods
                .updateCharacterAdjectives(editForm.adjectives)
                .accounts({
                    aiNft: appAinftPda,
                    aiCharacter: aiCharacter,
                    authority: publicKey,
                    aiCharacterMint: aiCharacterMint,
                    authorityAiCharacterTokenAccount: authorityAiCharacterTokenAccount,
                })
                .instruction();
            instructions.push(updateAdjectivesIx);

            // Get the latest blockhash
            const latestBlockhash = await connection.getLatestBlockhash('confirmed');

            // Create a versioned transaction
            const messageV0 = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions: instructions
            }).compileToV0Message();

            const transaction = new VersionedTransaction(messageV0);

            // Sign and send the transaction
            const signedTransaction = await wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());

            // Confirm the transaction
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            });

            if (confirmation.value.err) {
                throw new Error(`Transaction failed to confirm: ${confirmation.value.err}`);
            }

            console.log('NFT updated successfully:', signature);

            // Refresh the NFT data
            const updatedNftData = await fetchAiCharacterNft(program, connection, nft.address);
            setNft(updatedNftData);

            // Show success message
            setError(null);

        } catch (err) {
            console.error('Error updating NFT:', err);
            setError(err instanceof Error ? err.message : 'Failed to update NFT data');
        } finally {
            setSaving(false);
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
                                Owner: <span className="font-mono">{truncateAddress(nft.owner.toBase58())}</span>
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
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={handleSave}
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