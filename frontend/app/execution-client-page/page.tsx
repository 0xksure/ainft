'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import PageLayout from '../components/PageLayout';

export default function ExecutionClientPage() {
    const wallet = useWallet();
    const { } = useNetworkStore();
    const program = useAnchorProgram();

    const [gas, setGas] = useState('100');
    const [messageTypes, setMessageTypes] = useState(['text']);
    const [stakerFeeShare, setStakerFeeShare] = useState('10');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isRegistered, setIsRegistered] = useState(false);
    const [clientStats, setClientStats] = useState({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalEarned: 0,
    });

    // Helper function to update message types
    const updateMessageType = (index: number, value: string) => {
        const newMessageTypes = [...messageTypes];
        newMessageTypes[index] = value;
        setMessageTypes(newMessageTypes);
    };

    // Helper function to add message type
    const addMessageType = () => {
        setMessageTypes([...messageTypes, '']);
    };

    // Helper function to remove message type
    const removeMessageType = (index: number) => {
        if (messageTypes.length <= 1) return;
        const newMessageTypes = [...messageTypes];
        newMessageTypes.splice(index, 1);
        setMessageTypes(newMessageTypes);
    };

    const handleRegister = async (e: React.FormEvent) => {
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

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate inputs
            const gasValue = parseInt(gas);
            if (isNaN(gasValue) || gasValue <= 0) {
                throw new Error('Gas must be a positive number');
            }

            const stakerFeeShareValue = parseInt(stakerFeeShare);
            if (isNaN(stakerFeeShareValue) || stakerFeeShareValue < 0 || stakerFeeShareValue > 100) {
                throw new Error('Staker fee share must be between 0 and 100');
            }

            // Filter out empty message types
            const filteredMessageTypes = messageTypes.filter(type => type.trim() !== '');
            if (filteredMessageTypes.length === 0) {
                throw new Error('At least one message type is required');
            }

            // This would be the actual call to register an execution client
            // const txId = await registerExecutionClient(
            //   program,
            //   wallet.publicKey!,
            //   gasValue,
            //   filteredMessageTypes,
            //   stakerFeeShareValue
            // );

            console.log('Would register execution client with gas:', gasValue);
            console.log('Message types:', filteredMessageTypes);
            console.log('Staker fee share:', stakerFeeShareValue);

            // Simulate success
            setTimeout(() => {
                setSuccess('Execution client registered successfully! Transaction ID: [placeholder]');
                setIsRegistered(true);
                setIsLoading(false);
            }, 1500);

        } catch (err) {
            console.error('Error registering execution client:', err);
            setError(`Error registering execution client: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
        }
    };

    const handleUpdateConfig = async (e: React.FormEvent) => {
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

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate inputs
            const gasValue = parseInt(gas);
            if (isNaN(gasValue) || gasValue <= 0) {
                throw new Error('Gas must be a positive number');
            }

            // This would be the actual call to update the execution client config
            // const txId = await program.methods
            //   .updateExecutionClientConfig(gasValue)
            //   .accounts({
            //     owner: wallet.publicKey!,
            //     // other accounts...
            //   })
            //   .rpc();

            console.log('Would update execution client config with gas:', gasValue);

            // Simulate success
            setTimeout(() => {
                setSuccess('Execution client configuration updated successfully! Transaction ID: [placeholder]');
                setIsLoading(false);
            }, 1500);

        } catch (err) {
            console.error('Error updating execution client config:', err);
            setError(`Error updating execution client config: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
        }
    };

    return (
        <PageLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">Execution Client</h1>

                {!wallet.connected ? (
                    <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-6">
                        <p className="text-yellow-300">Please connect your wallet to manage your execution client.</p>
                    </div>
                ) : null}

                {error && (
                    <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 mb-6">
                        <p className="text-green-300">{success}</p>
                    </div>
                )}

                {isRegistered ? (
                    <div className="space-y-6">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4">Execution Client Stats</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-400">Total Requests</p>
                                    <p className="text-2xl font-bold">{clientStats.totalRequests}</p>
                                </div>
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-400">Success Rate</p>
                                    <p className="text-2xl font-bold">
                                        {clientStats.totalRequests === 0
                                            ? '0%'
                                            : `${Math.round(
                                                (clientStats.successfulRequests / clientStats.totalRequests) * 100
                                            )}%`}
                                    </p>
                                </div>
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-400">Total Earned</p>
                                    <p className="text-2xl font-bold">{clientStats.totalEarned} SOL</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4">Update Configuration</h2>
                            <form onSubmit={handleUpdateConfig} className="space-y-4">
                                <div>
                                    <label htmlFor="gas" className="block text-sm font-medium text-gray-300 mb-1">
                                        Gas (in lamports)
                                    </label>
                                    <input
                                        type="number"
                                        id="gas"
                                        value={gas}
                                        onChange={(e) => setGas(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading || !wallet.connected}
                                        className={`px-6 py-3 rounded-lg font-medium ${isLoading || !wallet.connected
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-sky-600 to-sky-400 hover:opacity-90'
                                            }`}
                                    >
                                        {isLoading ? 'Updating...' : 'Update Configuration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Register Execution Client</h2>
                        <p className="text-gray-300 mb-6">
                            Register as an execution client to process AI NFT messages and earn rewards.
                        </p>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label htmlFor="gas" className="block text-sm font-medium text-gray-300 mb-1">
                                    Gas (in lamports)
                                </label>
                                <input
                                    type="number"
                                    id="gas"
                                    value={gas}
                                    onChange={(e) => setGas(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    min="1"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    The amount of gas you require to process a message.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Supported Message Types
                                </label>
                                {messageTypes.map((type, index) => (
                                    <div key={index} className="flex mb-2">
                                        <input
                                            type="text"
                                            value={type}
                                            onChange={(e) => updateMessageType(index, e.target.value)}
                                            className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                            placeholder="e.g., text, image, audio"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMessageType(index)}
                                            className="ml-2 px-3 py-2 bg-red-800 rounded-md hover:bg-red-700"
                                        >
                                            -
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addMessageType}
                                    className="px-3 py-1 bg-sky-700 rounded-md hover:bg-sky-600 text-sm"
                                >
                                    Add Message Type
                                </button>
                            </div>

                            <div>
                                <label htmlFor="stakerFeeShare" className="block text-sm font-medium text-gray-300 mb-1">
                                    Staker Fee Share (%)
                                </label>
                                <input
                                    type="number"
                                    id="stakerFeeShare"
                                    value={stakerFeeShare}
                                    onChange={(e) => setStakerFeeShare(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    min="0"
                                    max="100"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    The percentage of fees that will be shared with stakers.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading || !wallet.connected}
                                    className={`px-6 py-3 rounded-lg font-medium ${isLoading || !wallet.connected
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-sky-600 to-sky-400 hover:opacity-90'
                                        }`}
                                >
                                    {isLoading ? 'Registering...' : 'Register Execution Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </PageLayout>
    );
} 