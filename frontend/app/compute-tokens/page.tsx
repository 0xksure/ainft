'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { BN } from '@coral-xyz/anchor';
import { motion } from 'framer-motion';
import { useNetworkStore } from '../stores/networkStore';
import { useAnchorProgram } from '../utils/anchor';
import {
    getComputeBalances,
    setExternalComputeMint,
    createStakeAccount,
    stakeCompute,
    unstakeCompute,
    fetchExecutionClientByAuthority,
    getComputeMint
} from '../utils/anchor';
import Link from 'next/link';
import { getExplorerUrl } from '../utils/explorer';

export default function ComputeTokensPage() {
    const wallet = useWallet();
    const { program, loading: programLoading } = useAnchorProgram();
    const { network, connection } = useNetworkStore();

    // State for compute token balances
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [agentBalance, setAgentBalance] = useState<number | null>(null);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

    // State for external token management
    const [externalTokenAddress, setExternalTokenAddress] = useState('');
    const [isSettingExternalToken, setIsSettingExternalToken] = useState(false);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // State for staking
    const [hasStakeAccount, setHasStakeAccount] = useState(false);
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [isStaking, setIsStaking] = useState(false);
    const [isUnstaking, setIsUnstaking] = useState(false);
    const [isCreatingStakeAccount, setIsCreatingStakeAccount] = useState(false);
    const [stakedAmount, setStakedAmount] = useState<number | null>(null);
    const [executionClientKey, setExecutionClientKey] = useState<PublicKey | null>(null);

    // Error handling
    const [error, setError] = useState<string | null>(null);

    // Compute mint
    const [computeMint, setComputeMint] = useState<PublicKey | null>(null);

    // Load balances and stake info when the wallet or program changes
    useEffect(() => {
        if (wallet.publicKey && program && connection) {
            loadBalances();
            checkExecutionClient();
            loadComputeMint();
        }
    }, [wallet.publicKey, program, connection]);

    // Load compute mint
    const loadComputeMint = async () => {
        try {
            if (!program) return;

            const mint = await getComputeMint(program);
            setComputeMint(mint);
            console.log('Compute mint:', mint.toString());
        } catch (error) {
            console.error('Error loading compute mint:', error);
        }
    };

    // Load compute token balances
    const loadBalances = async () => {
        if (!wallet.publicKey || !program || !connection) return;

        setIsLoadingBalances(true);
        setError(null);

        try {
            const { walletBalance, agentBalance } = await getComputeBalances(program, connection, wallet.publicKey, null);
            setWalletBalance(walletBalance);
            setAgentBalance(agentBalance);
        } catch (error) {
            console.error('Error loading balances:', error);
            setError('Failed to load compute token balances');
        } finally {
            setIsLoadingBalances(false);
        }
    };

    // Check if the wallet has an execution client and stake account
    const checkExecutionClient = async () => {
        if (!wallet.publicKey || !program) return;

        try {
            const executionClient = await fetchExecutionClientByAuthority(program, wallet.publicKey);
            if (executionClient) {
                setExecutionClientKey(executionClient.publicKey);
                setHasStakeAccount(true); // This is a simplification, ideally check specifically for stake account
            }
        } catch (error) {
            console.error('Error checking execution client:', error);
            // No execution client found is not necessarily an error
        }
    };

    // Set external compute token mint
    const handleSetExternalToken = async () => {
        if (!wallet.signTransaction || !program || !connection) return;

        setIsSettingExternalToken(true);
        setError(null);
        setTxSignature(null);

        try {
            const mintPubkey = new PublicKey(externalTokenAddress);
            const result = await setExternalComputeMint(program, wallet, connection, mintPubkey);
            setTxSignature(result.txId);
            await loadComputeMint();
        } catch (error) {
            console.error('Error setting external token:', error);
            setError(`Failed to set external token: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSettingExternalToken(false);
        }
    };

    // Create stake account
    const handleCreateStakeAccount = async () => {
        if (!wallet.signTransaction || !program || !connection) return;

        setIsCreatingStakeAccount(true);
        setError(null);
        setTxSignature(null);

        try {
            const result = await createStakeAccount(program, wallet, connection);
            setTxSignature(result.txId);
            setHasStakeAccount(true);
        } catch (error) {
            console.error('Error creating stake account:', error);
            setError(`Failed to create stake account: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsCreatingStakeAccount(false);
        }
    };

    // Stake compute tokens
    const handleStakeCompute = async () => {
        if (!wallet.signTransaction || !program || !connection) return;

        setIsStaking(true);
        setError(null);
        setTxSignature(null);

        try {
            const amountBN = new BN(parseFloat(stakeAmount) * (10 ** 9)); // assuming 9 decimals
            const result = await stakeCompute(program, wallet, connection, amountBN);
            setTxSignature(result.txId);
            await loadBalances();
            setStakeAmount('');
        } catch (error) {
            console.error('Error staking compute tokens:', error);
            setError(`Failed to stake tokens: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsStaking(false);
        }
    };

    // Unstake compute tokens
    const handleUnstakeCompute = async () => {
        if (!wallet.signTransaction || !program || !connection) return;

        setIsUnstaking(true);
        setError(null);
        setTxSignature(null);

        try {
            const amountBN = new BN(parseFloat(unstakeAmount) * (10 ** 9)); // assuming 9 decimals
            const result = await unstakeCompute(program, wallet, connection, amountBN);
            setTxSignature(result.txId);
            await loadBalances();
            setUnstakeAmount('');
        } catch (error) {
            console.error('Error unstaking compute tokens:', error);
            setError(`Failed to unstake tokens: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsUnstaking(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold mb-6">Compute Token Management</h1>

                {!wallet.publicKey ? (
                    <div className="bg-gray-800 p-6 rounded-lg mb-8 text-center">
                        <p className="text-xl mb-4">Connect your wallet to manage compute tokens</p>
                        <div className="flex justify-center">
                            <WalletMultiButton />
                        </div>
                    </div>
                ) : programLoading ? (
                    <div className="bg-gray-800 p-6 rounded-lg mb-8">
                        <p className="text-xl mb-4">Loading program...</p>
                        <div className="animate-pulse h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                        <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2"></div>
                    </div>
                ) : (
                    <>
                        {/* Balance Display */}
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <h2 className="text-2xl font-semibold mb-4">Your Compute Token Balances</h2>
                            {isLoadingBalances ? (
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 border border-gray-700 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Wallet Balance</h3>
                                        <p className="text-2xl">{walletBalance !== null ? walletBalance.toLocaleString() : 'N/A'}</p>
                                    </div>

                                    <div className="p-4 border border-gray-700 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Agent Balance</h3>
                                        <p className="text-2xl">{agentBalance !== null ? agentBalance.toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <button
                                    onClick={loadBalances}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
                                >
                                    Refresh Balances
                                </button>
                            </div>
                        </div>

                        {/* Current Compute Mint */}
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <h2 className="text-2xl font-semibold mb-4">Current Compute Mint</h2>
                            <p className="break-all font-mono bg-gray-900 p-3 rounded mb-4">
                                {computeMint ? computeMint.toString() : 'Not initialized'}
                            </p>
                            {computeMint && (
                                <Link
                                    href={getExplorerUrl('address', computeMint.toString(), network)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    View on Explorer
                                </Link>
                            )}
                        </div>

                        {/* External Token Setting */}
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <h2 className="text-2xl font-semibold mb-4">Set External Compute Token</h2>
                            <p className="mb-4 text-gray-400">
                                Use this option to set an externally created SPL token as the compute token for the AI NFT platform.
                                This operation can only be performed once and is irreversible.
                            </p>

                            <div className="mb-4">
                                <label htmlFor="externalTokenAddress" className="block mb-2">External Token Mint Address</label>
                                <input
                                    id="externalTokenAddress"
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                    value={externalTokenAddress}
                                    onChange={(e) => setExternalTokenAddress(e.target.value)}
                                    placeholder="Enter SPL token mint address"
                                />
                            </div>

                            <button
                                onClick={handleSetExternalToken}
                                disabled={isSettingExternalToken || !externalTokenAddress}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSettingExternalToken ? 'Setting External Token...' : 'Set External Token'}
                            </button>
                        </div>

                        {/* Staking Compute Tokens */}
                        <div className="bg-gray-800 p-6 rounded-lg mb-8">
                            <h2 className="text-2xl font-semibold mb-4">Stake Compute Tokens</h2>

                            {!hasStakeAccount ? (
                                <>
                                    <p className="mb-4 text-gray-400">
                                        You need to create a stake account before you can stake compute tokens.
                                    </p>
                                    <button
                                        onClick={handleCreateStakeAccount}
                                        disabled={isCreatingStakeAccount}
                                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreatingStakeAccount ? 'Creating Stake Account...' : 'Create Stake Account'}
                                    </button>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 border border-gray-700 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Stake Tokens</h3>
                                        <div className="mb-4">
                                            <label htmlFor="stakeAmount" className="block mb-2">Amount to Stake</label>
                                            <input
                                                id="stakeAmount"
                                                type="number"
                                                min="0"
                                                step="0.000000001"
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                                placeholder="Enter amount to stake"
                                            />
                                        </div>
                                        <button
                                            onClick={handleStakeCompute}
                                            disabled={isStaking || !stakeAmount}
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isStaking ? 'Staking...' : 'Stake Tokens'}
                                        </button>
                                    </div>

                                    <div className="p-4 border border-gray-700 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Unstake Tokens</h3>
                                        <div className="mb-4">
                                            <label htmlFor="unstakeAmount" className="block mb-2">Amount to Unstake</label>
                                            <input
                                                id="unstakeAmount"
                                                type="number"
                                                min="0"
                                                step="0.000000001"
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                                value={unstakeAmount}
                                                onChange={(e) => setUnstakeAmount(e.target.value)}
                                                placeholder="Enter amount to unstake"
                                            />
                                        </div>
                                        <button
                                            onClick={handleUnstakeCompute}
                                            disabled={isUnstaking || !unstakeAmount}
                                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUnstaking ? 'Unstaking...' : 'Unstake Tokens'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transaction Result */}
                        {txSignature && (
                            <div className="bg-green-900/30 border border-green-700 p-6 rounded-lg mb-8">
                                <h2 className="text-2xl font-semibold mb-4">Transaction Successful</h2>
                                <p className="mb-2">Transaction signature:</p>
                                <p className="break-all font-mono bg-gray-900 p-3 rounded mb-4">
                                    {txSignature}
                                </p>
                                <Link
                                    href={getExplorerUrl('tx', txSignature, network)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    View on Explorer
                                </Link>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg mb-8">
                                <h2 className="text-2xl font-semibold mb-4">Error</h2>
                                <p>{error}</p>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
} 