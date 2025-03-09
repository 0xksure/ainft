'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNetworkStore } from '../stores/networkStore';
import { NetworkType } from '../utils/anchor';

const Navbar: FC = () => {
    const pathname = usePathname();
    const { selectedNetwork, setNetwork } = useNetworkStore();
    const [showDebug, setShowDebug] = useState(false);

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNetwork(e.target.value as NetworkType);
    };

    const toggleDebug = () => {
        setShowDebug(!showDebug);
        console.log('Debug toggled:', !showDebug);
    };

    return (
        <>
            <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-sky-400">
                                AI NFT
                            </Link>
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link
                                    href="/"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/'
                                            ? 'bg-sky-800 text-white'
                                            : 'text-gray-300 hover:bg-sky-800 hover:text-white'
                                        }`}
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/mint"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/mint'
                                            ? 'bg-sky-800 text-white'
                                            : 'text-gray-300 hover:bg-sky-800 hover:text-white'
                                        }`}
                                >
                                    Mint AI
                                </Link>
                                <Link
                                    href="/chat"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/chat'
                                            ? 'bg-sky-800 text-white'
                                            : 'text-gray-300 hover:bg-sky-800 hover:text-white'
                                        }`}
                                >
                                    Chat
                                </Link>
                                <Link
                                    href="/manage"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/manage'
                                            ? 'bg-sky-800 text-white'
                                            : 'text-gray-300 hover:bg-sky-800 hover:text-white'
                                        }`}
                                >
                                    Manage
                                </Link>
                                <Link
                                    href="/execution-client"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/execution-client'
                                            ? 'bg-sky-800 text-white'
                                            : 'text-gray-300 hover:bg-sky-800 hover:text-white'
                                        }`}
                                >
                                    Execution Client
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Network selector */}
                            <div className="flex items-center">
                                <label htmlFor="network-select" className="mr-2 text-sm text-gray-300">
                                    Network:
                                </label>
                                <select
                                    id="network-select"
                                    className="bg-gray-800 text-white text-sm rounded-md px-2 py-1 border border-gray-700"
                                    value={selectedNetwork}
                                    onChange={handleNetworkChange}
                                >
                                    <option value="localnet">Localnet</option>
                                    <option value="devnet">Devnet</option>
                                    <option value="mainnet-beta">Mainnet</option>
                                </select>
                            </div>

                            <button
                                className="text-xs text-gray-400 hover:text-white"
                                onClick={toggleDebug}
                            >
                                {showDebug ? "Hide Debug" : "Debug"}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Wallet button in a separate, prominent position */}
            <div className="wallet-button-container">
                <WalletMultiButton />
            </div>

            {showDebug && (
                <div className="bg-gray-800 p-4 text-xs">
                    <h3 className="font-bold mb-2">Debug Info:</h3>
                    <p>Network: {selectedNetwork}</p>
                    {/* More debug info can be added here */}
                </div>
            )}
        </>
    );
};

export default Navbar; 