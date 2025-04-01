'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorProgram, sendMessage, getMessagesForAiNft, getAiCharacterComputeTokenBalance, transferComputeTokensToAiCharacter } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { Send, Share2, Coins } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { programs } from "@metaplex/js";
import { generatePixelatedImage } from '../utils/pixelate';
import { decodeByteArray, decodeByteArrays } from '../utils/byteDecoder';
import { bytesToString } from '../utils/metadata';
import { useToast } from '../components/ui/toast';

// Message type definition
interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    status: 'sending' | 'sent' | 'error';
    error?: string;
    response?: string;
    answered?: boolean;
}

// AI NFT interface
interface AiNft {
    address: string;
    name: string;
    description: string;
    imageUrl: string;
    dateCreated: Date;
    computeTokenBalance?: number;
}

export default function ChatPage() {
    const wallet = useWallet();
    const { network, connection } = useNetworkStore();
    const { program, loading: programLoading, error: programError } = useAnchorProgram();
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addToast } = useToast();

    // AI NFT state
    const [aiNftAddress, setAiNftAddress] = useState<string>('');
    const [isValidAddress, setIsValidAddress] = useState<boolean>(false);
    const [allAiNfts, setAllAiNfts] = useState<AiNft[]>([]);
    const [loadingNfts, setLoadingNfts] = useState<boolean>(true);
    const [nftError, setNftError] = useState<string | null>(null);
    const [loadingBalances, setLoadingBalances] = useState<boolean>(false);
    const [donationAmount, setDonationAmount] = useState<number>(1);
    const [donating, setDonating] = useState<boolean>(false);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);

        // Check if there's an NFT address in the URL
        const addressParam = searchParams?.get('address');
        if (addressParam) {
            setAiNftAddress(addressParam);
        }
    }, [searchParams]);

    // Load all AI NFTs
    useEffect(() => {
        if (!isClient || !program || !connection) return;

        const fetchAllAiNfts = async () => {
            try {
                setLoadingNfts(true);
                setNftError(null);

                // Fetch all AI Character NFTs from the program
                const allNfts = await program.account.aiCharacterNft.all();
                const { metadata: { Metadata } } = programs;

                // Transform the data to match our AiNft interface
                const formattedNfts: AiNft[] = await Promise.all(
                    allNfts.map(async (item: any) => {
                        try {
                            const metadataPDA = await Metadata.getPDA(item.account.characterNftMint);
                            const tokenMetadata = await Metadata.load(connection, metadataPDA);

                            // Get name from token metadata
                            const name = tokenMetadata.data.data.name || 'Unnamed AI';

                            // Get description from bio fields if available
                            const bioTexts = item.account.characterConfig?.bio
                                ? decodeByteArrays(item.account.characterConfig.bio)
                                : [];
                            const description = bioTexts.length > 0
                                ? bioTexts.join(' ')
                                : 'No description available';

                            // Use current timestamp if createdAt is not available
                            const createdTimestamp = Date.now();

                            // Get compute token balance
                            const computeTokenBalance = await getAiCharacterComputeTokenBalance(
                                connection,
                                new PublicKey(item.account.characterNftMint)
                            );

                            return {
                                address: item.publicKey.toString(),
                                name: name,
                                description: description,
                                imageUrl: tokenMetadata.data.data.uri || '/placeholder-image.png',
                                dateCreated: new Date(createdTimestamp),
                                computeTokenBalance: computeTokenBalance
                            };
                        } catch (err) {
                            console.error('Error loading metadata for NFT:', err);

                            // Even if metadata loading fails, try to get a name
                            let name = 'Unnamed AI';
                            try {
                                if (item.account.characterConfig && item.account.characterConfig.name) {
                                    // Fallback to character config name if metadata failed
                                    name = bytesToString(Array.from(item.account.characterConfig.name)) || name;
                                }
                            } catch (decodeErr) {
                                console.error('Error decoding name:', decodeErr);
                            }

                            return {
                                address: item.publicKey.toString(),
                                name: name,
                                description: 'Metadata unavailable',
                                imageUrl: '/placeholder-image.png',
                                dateCreated: new Date(Date.now()),
                                computeTokenBalance: 0
                            };
                        }
                    })
                );

                setAllAiNfts(formattedNfts);
                setLoadingNfts(false);
            } catch (err) {
                console.error('Error fetching AI NFTs:', err);
                setNftError(err instanceof Error ? err.message : 'Unknown error occurred');
                setLoadingNfts(false);
            }
        };

        fetchAllAiNfts();
    }, [isClient, program, connection]);

    // Validate AI NFT address
    useEffect(() => {
        try {
            if (aiNftAddress.trim() === '') {
                setIsValidAddress(false);
                return;
            }

            // Try to create a PublicKey from the address
            new PublicKey(aiNftAddress);
            setIsValidAddress(true);
        } catch (error) {
            setIsValidAddress(false);
        }
    }, [aiNftAddress]);

    // Handle selecting an AI NFT
    const handleSelectNft = (address: string) => {
        setAiNftAddress(address);
        // Update URL for sharing
        router.push(`/chat?address=${address}`);
    };

    // Copy share link to clipboard
    const copyShareLink = () => {
        const shareUrl = `${window.location.origin}/chat?address=${aiNftAddress}`;
        navigator.clipboard.writeText(shareUrl);
        // You could add a toast notification here
    };

    // Handle sending a message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wallet.publicKey || !program || !connection) {
            addMessage({
                id: Date.now().toString(),
                content: 'Wallet not connected or program not loaded',
                sender: 'ai',
                timestamp: new Date(),
                status: 'error',
                error: 'Wallet not connected or program not loaded'
            });
            return;
        }

        if (!isValidAddress) {
            addMessage({
                id: Date.now().toString(),
                content: 'Please select a valid AI NFT first',
                sender: 'ai',
                timestamp: new Date(),
                status: 'error',
                error: 'No AI NFT selected'
            });
            return;
        }

        if (!newMessage.trim()) {
            return;
        }

        const messageContent = newMessage.trim();
        const messageId = Date.now().toString();

        // Add user message to chat
        addMessage({
            id: messageId,
            content: messageContent,
            sender: 'user',
            timestamp: new Date(),
            status: 'sending',
        });

        // Clear input
        setNewMessage('');

        try {
            setIsSending(true);

            // Send message to AI NFT
            const result = await sendMessage(
                program,
                wallet,
                connection,
                new PublicKey(aiNftAddress),
                messageContent
            );

            // Update message status
            updateMessageStatus(messageId, 'sent');

            // Fetch messages after sending
            await fetchMessages();

        } catch (error) {
            console.error('Error sending message:', error);
            updateMessageStatus(
                messageId,
                'error',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        } finally {
            setIsSending(false);
        }
    };

    // Add a function to fetch messages
    const fetchMessages = async () => {
        if (!program || !aiNftAddress) return;

        try {
            const fetchedMessages = await getMessagesForAiNft(
                program,
                new PublicKey(aiNftAddress)
            );

            // Process and update the messages state
            const formattedMessages: Message[] = fetchedMessages.map((msg: any) => ({
                id: msg.publicKey.toString(),
                content: msg.account.content || '',
                sender: msg.account.sender.equals(wallet.publicKey) ? 'user' : 'ai',
                timestamp: new Date(msg.account.timestamp?.toNumber() || Date.now()),
                status: 'sent',
                response: msg.account.response || '',
                answered: msg.account.answered || false
            }));

            // Update the messages state
            setMessages(formattedMessages);

        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Add this effect to fetch messages when the AI NFT address changes
    useEffect(() => {
        if (isValidAddress && program) {
            fetchMessages();
        }
    }, [aiNftAddress, program, isValidAddress]);

    // Set up Anchor listeners for message updates
    useEffect(() => {
        if (!program || !aiNftAddress || !isValidAddress) return;
        
        // Create a listener for the ResponseWritten event
        const listener = program.addEventListener('responseWritten', (event: any) => {
            console.log('Response written event:', event);
            // Check if this event is for our AI NFT
            if (event.aiNft.toString() === aiNftAddress) {
                fetchMessages(); // Refresh messages when an event occurs
            }
        });
        
        // Set up a listener for account changes to detect responses
        const messageListener = program.account.messageAiCharacter.subscribe(
            // Use the program ID as a filter instead of null
            program.programId,
            'confirmed'
        );
        
        messageListener.on('change', (account: any, context: any) => {
            console.log('Message account changed:', account);
            
            // Check if this message belongs to our AI NFT
            if (account.aiNft.toString() === aiNftAddress) {
                // Update the messages state with the new response
                setMessages(prevMessages => 
                    prevMessages.map(msg => {
                        if (msg.id === context.accountId.toString()) {
                            return {
                                ...msg,
                                response: account.response || '',
                                answered: account.answered || false,
                                status: 'sent'
                            };
                        }
                        return msg;
                    })
                );
            }
        });

        // Return cleanup function
        return () => {
            // Remove event listeners when component unmounts
            program.removeEventListener(listener);
            messageListener.removeAllListeners();
        };
    }, [program, aiNftAddress, isValidAddress, fetchMessages]);

    // Add a message to the chat
    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    // Update message status
    const updateMessageStatus = (id: string, status: 'sending' | 'sent' | 'error', error?: string) => {
        setMessages(prev =>
            prev.map(msg =>
                msg.id === id
                    ? { ...msg, status, ...(error ? { error } : {}) }
                    : msg
            )
        );
    };

    // Handle donation to AI character
    const handleDonation = async () => {
        if (!wallet.publicKey || !program || !connection || !isValidAddress) {
            addToast("Wallet not connected or AI character not selected", "error");
            return;
        }

        try {
            setDonating(true);
            const aiCharacterMint = allAiNfts.find(nft => nft.address === aiNftAddress)?.address;

            if (!aiCharacterMint) {
                throw new Error("AI character not found");
            }

            const txid = await transferComputeTokensToAiCharacter(
                connection,
                wallet,
                new PublicKey(aiCharacterMint),
                donationAmount
            );

            addToast(`Successfully donated ${donationAmount} compute tokens!`, "success");

            // Refresh the compute token balance
            const updatedNfts = await Promise.all(
                allAiNfts.map(async (nft) => {
                    if (nft.address === aiNftAddress) {
                        const newBalance = await getAiCharacterComputeTokenBalance(
                            connection,
                            new PublicKey(nft.address)
                        );
                        return { ...nft, computeTokenBalance: newBalance };
                    }
                    return nft;
                })
            );

            setAllAiNfts(updatedNfts);
        } catch (error) {
            console.error("Error donating compute tokens:", error);
            addToast(`Failed to donate: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
        } finally {
            setDonating(false);
        }
    };

    // Add this function inside your component
    const getPixelatedPlaceholder = (address: string) => {
        // Only run on client side
        if (typeof window === 'undefined') return '';

        // Generate a unique pixelated image for this address
        return generatePixelatedImage(address);
    };

    // Only render wallet-dependent content on the client
    if (!isClient) {
        return (
            <PageLayout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Chat with AI NFT</h1>
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
                    <h1 className="text-3xl font-bold mb-6">Chat with AI NFT</h1>

                    {!wallet.publicKey ? (
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <p className="text-xl mb-4">Connect your wallet to chat with an AI NFT</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* AI NFT List */}
                            <div className="md:col-span-1">
                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h2 className="text-2xl font-semibold mb-4">Available AI NFTs</h2>

                                    {loadingNfts ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="bg-gray-700 p-4 rounded-lg animate-pulse">
                                                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                                                    <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : nftError ? (
                                        <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg">
                                            <p>Error loading AI NFTs: {nftError}</p>
                                        </div>
                                    ) : allAiNfts.length === 0 ? (
                                        <div className="text-center p-4">
                                            <p>No AI NFTs found</p>
                                            <Link
                                                href="/mint"
                                                className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                                            >
                                                Create an AI NFT
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                            {allAiNfts.map((nft) => (
                                                <div
                                                    key={nft.address}
                                                    onClick={() => handleSelectNft(nft.address)}
                                                    className={cn(
                                                        "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                                                        aiNftAddress === nft.address
                                                            ? "bg-blue-600/30 border border-blue-500"
                                                            : "bg-gray-700 hover:bg-gray-600 border border-transparent"
                                                    )}
                                                >
                                                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-600">
                                                        <img
                                                            src={nft.imageUrl}
                                                            alt={nft.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                const nftAddress = allAiNfts.find(nft =>
                                                                    nft.imageUrl === target.src
                                                                )?.address || aiNftAddress;

                                                                // Generate pixelated placeholder based on the NFT address
                                                                target.src = getPixelatedPlaceholder(nftAddress);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <h3 className="font-medium truncate">{nft.name}</h3>
                                                        <p className="text-xs text-gray-400 truncate">{nft.description}</p>
                                                        <div className={cn(
                                                            "text-xs mt-1",
                                                            (nft.computeTokenBalance !== undefined && nft.computeTokenBalance < 5)
                                                                ? "text-red-400"
                                                                : "text-green-400"
                                                        )}>
                                                            <Coins size={12} className="inline mr-1" />
                                                            {nft.computeTokenBalance !== undefined
                                                                ? `${nft.computeTokenBalance.toFixed(2)} tokens`
                                                                : "Loading..."}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Chat Interface */}
                            <div className="md:col-span-2">
                                {isValidAddress ? (
                                    <div className="space-y-4">
                                        {/* Selected NFT Info & Share Button */}
                                        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-700">
                                                    <img
                                                        src={allAiNfts.find(nft => nft.address === aiNftAddress)?.imageUrl || '/placeholder-image.png'}
                                                        alt="AI NFT"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            const nftAddress = allAiNfts.find(nft =>
                                                                nft.imageUrl === target.src
                                                            )?.address || aiNftAddress;

                                                            // Generate pixelated placeholder based on the NFT address
                                                            target.src = getPixelatedPlaceholder(nftAddress);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">
                                                        {allAiNfts.find(nft => nft.address === aiNftAddress)?.name || 'AI NFT'}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">{aiNftAddress.slice(0, 8)}...{aiNftAddress.slice(-8)}</p>
                                                    <div className={cn(
                                                        "text-xs mt-1",
                                                        (allAiNfts.find(nft => nft.address === aiNftAddress)?.computeTokenBalance !== undefined &&
                                                            allAiNfts.find(nft => nft.address === aiNftAddress)?.computeTokenBalance! < 5)
                                                            ? "text-red-400"
                                                            : "text-green-400"
                                                    )}>
                                                        <Coins size={12} className="inline mr-1" />
                                                        {allAiNfts.find(nft => nft.address === aiNftAddress)?.computeTokenBalance !== undefined
                                                            ? `${allAiNfts.find(nft => nft.address === aiNftAddress)?.computeTokenBalance!.toFixed(2)} tokens`
                                                            : "Loading..."}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        min="0.1"
                                                        step="0.1"
                                                        value={donationAmount}
                                                        onChange={(e) => setDonationAmount(parseFloat(e.target.value))}
                                                        className="w-16 px-2 py-1 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        onClick={handleDonation}
                                                        disabled={donating || !wallet.publicKey}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Coins size={14} className="mr-1" />
                                                        {donating ? 'Donating...' : 'Donate'}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={copyShareLink}
                                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center"
                                                >
                                                    <Share2 size={14} className="mr-1" />
                                                    Share
                                                </button>
                                            </div>
                                        </div>

                                        {/* Chat Messages */}
                                        <div className="bg-gray-800 rounded-lg overflow-hidden flex flex-col h-[500px]">
                                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                                {messages.length === 0 ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-gray-400">
                                                            Send a message to start chatting with the AI NFT
                                                        </p>
                                                    </div>
                                                ) : (
                                                    messages.map((message) => (
                                                        <div key={message.id}>
                                                            {/* User message */}
                                                            <div
                                                                className={cn(
                                                                    "max-w-[80%] rounded-lg p-3 mb-2",
                                                                    "bg-blue-600 ml-auto"
                                                                )}
                                                            >
                                                                <p>{message.content}</p>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="text-xs text-gray-400">
                                                                        {message.timestamp.toLocaleTimeString()}
                                                                    </span>
                                                                    {message.status === 'sending' && (
                                                                        <span className="text-xs text-gray-400">Sending...</span>
                                                                    )}
                                                                    {message.status === 'error' && (
                                                                        <span className="text-xs text-red-400">
                                                                            Error: {message.error}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* AI response - only show if there's a response */}
                                                            {message.response && (
                                                                <div
                                                                    className={cn(
                                                                        "max-w-[80%] rounded-lg p-3 mt-2",
                                                                        "bg-green-700 mr-auto"
                                                                    )}
                                                                >
                                                                    <p>{message.response}</p>
                                                                    <div className="flex items-center justify-between mt-2">
                                                                        <span className="text-xs text-gray-400">
                                                                            {new Date().toLocaleTimeString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Message Input */}
                                            <div className="border-t border-gray-700 p-4">
                                                <form onSubmit={handleSendMessage} className="flex">
                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        disabled={isSending}
                                                        className="flex-1 p-2 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Type your message..."
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={isSending || newMessage.trim() === ''}
                                                        className={cn(
                                                            "px-4 py-2 rounded-r font-medium flex items-center justify-center",
                                                            newMessage.trim() !== '' && !isSending
                                                                ? "bg-blue-600 hover:bg-blue-700"
                                                                : "bg-gray-600 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <Send size={18} className="mr-2" />
                                                        Send
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center justify-center h-[600px]">
                                        <div className="text-center mb-6">
                                            <h3 className="text-xl font-semibold mb-2">Select an AI NFT to chat with</h3>
                                            <p className="text-gray-400">Choose an AI NFT from the list or enter an address manually</p>
                                        </div>

                                        <div className="w-full max-w-md">
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    value={aiNftAddress}
                                                    onChange={(e) => setAiNftAddress(e.target.value)}
                                                    className="flex-1 p-2 bg-gray-700 rounded-l border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Enter AI NFT address"
                                                />
                                                <button
                                                    className={cn(
                                                        "px-4 py-2 rounded-r font-medium",
                                                        isValidAddress
                                                            ? "bg-green-600 hover:bg-green-700"
                                                            : "bg-gray-600 cursor-not-allowed"
                                                    )}
                                                    disabled={!isValidAddress}
                                                >
                                                    {isValidAddress ? "Valid" : "Invalid"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </PageLayout>
    );
}