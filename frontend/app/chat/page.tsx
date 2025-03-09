'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorProgram } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export default function ChatPage() {
    const wallet = useWallet();
    const { selectedNetwork } = useNetworkStore();
    const program = useAnchorProgram();

    const [aiNftAddress, setAiNftAddress] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Set mounted state on client-side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

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

        if (!aiNftAddress) {
            setError('Please enter an AI NFT address');
            return;
        }

        if (!message.trim()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Validate AI NFT address
            let aiNftPublicKey: PublicKey;
            try {
                aiNftPublicKey = new PublicKey(aiNftAddress);
            } catch (err) {
                setError('Invalid AI NFT address');
                setIsLoading(false);
                return;
            }

            // Add user message to the chat
            const userMessage: Message = {
                id: Date.now().toString(),
                sender: 'user',
                content: message,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setMessage('');

            // This would be the actual call to send a message to the AI NFT
            // const txId = await sendMessage(program, wallet.publicKey!, aiNftPublicKey, message);
            console.log('Would send message to AI NFT:', aiNftAddress, 'with content:', message);

            // Simulate AI response after a short delay
            setTimeout(() => {
                const aiResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    content: `This is a simulated response from the AI NFT. In a real implementation, this would be fetched from the blockchain after the AI has processed your message: "${message}"`,
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, aiResponse]);
                setIsLoading(false);
            }, 1500);

        } catch (err) {
            console.error('Error sending message:', err);
            setError(`Error sending message: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
        }
    };

    return (
        <PageLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">Chat with AI NFT</h1>

                {!wallet.connected ? (
                    <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-6">
                        <p className="text-yellow-300">Please connect your wallet to chat with an AI NFT.</p>
                    </div>
                ) : null}

                {error && (
                    <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
                    <label htmlFor="aiNftAddress" className="block text-sm font-medium text-gray-300 mb-1">
                        AI NFT Address
                    </label>
                    <input
                        type="text"
                        id="aiNftAddress"
                        value={aiNftAddress}
                        onChange={(e) => setAiNftAddress(e.target.value)}
                        placeholder="Enter the public key of the AI NFT"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white mb-2"
                    />
                    <p className="text-xs text-gray-400">
                        Enter the public key of the AI NFT you want to chat with.
                    </p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col h-[600px]">
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-400">No messages yet. Start a conversation!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user'
                                                ? 'bg-sky-800 text-white'
                                                : 'bg-gray-700 text-white'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className="text-xs text-gray-300 mt-1">
                                                {msg.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="border-t border-gray-700 p-4">
                        <div className="flex">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-l-md px-3 py-2 text-white"
                                disabled={isLoading || !wallet.connected || !aiNftAddress}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !wallet.connected || !aiNftAddress || !message.trim()}
                                className={`px-4 py-2 rounded-r-md ${isLoading || !wallet.connected || !aiNftAddress || !message.trim()
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-sky-600 hover:bg-sky-500'
                                    }`}
                            >
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageLayout>
    );
} 