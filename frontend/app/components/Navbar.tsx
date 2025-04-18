'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNetworkStore } from '../stores/networkStore';
import { useComputeBalanceStore } from '../stores/computeBalanceStore';
import { Network } from '../utils/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useToast } from './ui/toast';
import CopyableAddress from './CopyableAddress';

const Navbar: FC = () => {
    const pathname = usePathname();
    const { network, setNetwork, connection } = useNetworkStore();
    const {
        balance: computeBalance,
        isLoading: isLoadingBalance,
        fetchBalance: fetchComputeBalance,
        error: balanceError
    } = useComputeBalanceStore();
    const [showDebug, setShowDebug] = useState(false);
    const wallet = useWallet();
    const { addToast } = useToast();

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newNetwork = e.target.value as Network;
        setNetwork(newNetwork);
        addToast(`Network changed to ${newNetwork}`, 'info');

        // Refetch balance when network changes
        if (wallet.connected && wallet.publicKey && connection) {
            fetchComputeBalance(connection, wallet.publicKey);
        }
    };

    const toggleDebug = () => {
        setShowDebug(!showDebug);
        console.log('Debug toggled:', !showDebug);
    };

    // Format balance for display
    const formatBalance = (balance: number): string => {
        return balance.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    // Fetch compute balance when wallet, connection, or network changes
    useEffect(() => {
        if (wallet.connected && wallet.publicKey && connection) {
            console.log("Fetching compute balance from Navbar");
            fetchComputeBalance(connection, wallet.publicKey);
        }
    }, [wallet.connected, wallet.publicKey, connection, network, fetchComputeBalance]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link href="/">
                                <span className="text-xl font-bold text-white cursor-pointer">AI NFT</span>
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link href="/" className={`${pathname === '/' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium`}>
                                    Home
                                </Link>
                                <Link href="/mint" className={`${pathname === '/mint' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium`}>
                                    Mint
                                </Link>
                                <Link href="/chat" className={`${pathname === '/chat' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium`}>
                                    Chat
                                </Link>
                                <Link href="/manage" className={`${pathname === '/manage' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium`}>
                                    Manage
                                </Link>
                                <Link href="/compute-tokens" className={`${pathname === '/compute-tokens' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium`}>
                                    Compute Tokens
                                </Link>
                                <Link href="/create-character-config" className={`${pathname === '/create-character-config' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium`}>
                                    Character Config
                                </Link>
                                <Link href="/execution-client" className={`${pathname === '/execution-client' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium`}>
                                    Execution Client
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {/* Network Selector */}
                            <select
                                value={network}
                                onChange={handleNetworkChange}
                                className="mr-4 bg-gray-800 text-white text-sm rounded-md border border-gray-700 py-1 px-2"
                            >
                                <option value="mainnet-beta">Mainnet Beta</option>
                                <option value="devnet">Devnet</option>
                                <option value="testnet">Testnet</option>
                                <option value="localnet">Localnet</option>
                                <option value="sonic-devnet">Sonic Devnet</option>
                            </select>

                            {/* Compute Token Balance */}
                            {wallet.connected && (
                                <div
                                    className="flex items-center bg-gray-800/80 rounded-md px-3 py-1.5 border-2 border-sky-700 cursor-pointer hover:bg-gray-700/80 transition-colors mr-4"
                                    onClick={() => {
                                        if (computeBalance !== null) {
                                            addToast(`Compute balance: ${formatBalance(computeBalance)} tokens on ${network}`, 'info');
                                        } else {
                                            // Manually trigger a balance refresh when clicked if balance is null
                                            if (wallet.publicKey && connection) {
                                                fetchComputeBalance(connection, wallet.publicKey);
                                                addToast('Refreshing compute balance...', 'info');
                                            }
                                        }
                                    }}
                                >
                                    <span className="text-sm text-gray-300 mr-2">Compute:</span>
                                    {isLoadingBalance ? (
                                        <div className="h-4 w-16 bg-gray-700 animate-pulse rounded"></div>
                                    ) : computeBalance !== null ? (
                                        <span className="text-sm font-medium text-sky-300">
                                            {formatBalance(computeBalance)}
                                        </span>
                                    ) : (
                                        <span
                                            className="text-sm text-yellow-400 font-medium"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (wallet.publicKey && connection) {
                                                    addToast('Unable to display balance. Refreshing...', 'warning');
                                                    fetchComputeBalance(connection, wallet.publicKey);
                                                }
                                            }}
                                        >
                                            Not available
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Test Toast Button - Remove after debugging */}
                            <button
                                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md font-medium mr-4"
                                onClick={() => {
                                    // Test all toast types
                                    addToast('This is an info notification', 'info');
                                    setTimeout(() => addToast('This is a success notification', 'success'), 300);
                                    setTimeout(() => addToast('This is a warning notification', 'warning'), 600);
                                    setTimeout(() => addToast('This is an error notification', 'error'), 900);
                                    console.log('Toast test triggered');
                                }}
                            >
                                Test Notifications
                            </button>

                            {/* Debug Toggle Button */}
                            <button
                                onClick={toggleDebug}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded mr-4"
                            >
                                {showDebug ? 'Hide Debug' : 'Show Debug'}
                            </button>

                            {/* Wallet Button */}
                            <WalletMultiButton />
                        </div>
                    </div>
                </div>
            </div>

            {/* Debug Panel */}
            {showDebug && (
                <div className="bg-black/90 text-white p-2 text-xs">
                    <div>Network: {network}</div>
                    <div>Wallet Connected: {wallet.connected ? 'Yes' : 'No'}</div>
                    <div>Wallet Address: {wallet.publicKey ? <CopyableAddress address={wallet.publicKey} /> : 'None'}</div>
                    <div>Compute Balance: {computeBalance !== null ? computeBalance.toString() : 'Not loaded'}</div>
                    <div>Balance Loading: {isLoadingBalance ? 'Yes' : 'No'}</div>
                    {balanceError && <div>Balance Error: {balanceError}</div>}
                </div>
            )}
        </nav>
    );
};

export default Navbar;