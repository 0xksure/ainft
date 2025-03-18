'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNetworkStore } from '../stores/networkStore';
import { useComputeBalanceStore } from '../stores/computeBalanceStore';
import { Network } from '../utils/anchor';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import { Menu, X, ChevronDown, Check } from 'lucide-react';
import { useToast } from './ui/toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Mint AI', href: '/mint' },
    { name: 'Chat', href: '/chat' },
    { name: 'Manage', href: '/manage' },
    { name: 'Execution Client', href: '/execution-client' },
];

// Define network configuration with colors and proper typing
const networkConfig: Record<Network, { name: string; color: string }> = {
    'mainnet-beta': {
        name: 'Mainnet Beta',
        color: 'bg-green-500'
    },
    'devnet': {
        name: 'Devnet',
        color: 'bg-purple-500'
    },
    'testnet': {
        name: 'Testnet',
        color: 'bg-blue-500'
    },
    'localnet': {
        name: 'Localnet',
        color: 'bg-orange-500'
    },
    'sonic-devnet': {
        name: 'Sonic Devnet',
        color: 'bg-pink-500'
    }
};

export default function Header() {
    const pathname = usePathname();
    const { network: selectedNetwork, setNetwork, connection } = useNetworkStore();
    const { 
        balance: computeBalance, 
        isLoading: isLoadingBalance, 
        fetchBalance: fetchComputeBalance,
        lastUpdated: balanceLastUpdated
    } = useComputeBalanceStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [networkSwitching, setNetworkSwitching] = useState(false);
    const { addToast } = useToast();
    const wallet = useWallet();

    // Set mounted state on client-side
    useEffect(() => {
        setIsMounted(true);
    }, []);

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
            console.log('Fetching compute balance due to wallet/connection/network change');
            fetchComputeBalance(connection, wallet.publicKey);
            
            // Set up an interval to refresh the balance every 30 seconds
            const intervalId = setInterval(() => {
                if (wallet.connected && wallet.publicKey && connection) {
                    fetchComputeBalance(connection, wallet.publicKey);
                }
            }, 30000);
            
            return () => clearInterval(intervalId);
        }
    }, [wallet.connected, wallet.publicKey, connection, selectedNetwork, fetchComputeBalance]);

    // Handle scroll event to change header appearance
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle network change
    const handleNetworkChange = async (network: Network) => {
        try {
            setNetworkSwitching(true);
            setNetwork(network);
            // Show toast notification when network changes
            addToast(`Network changed to ${networkConfig[network].name}`, 'info');
            
            // Refetch compute balance when network changes
            if (wallet.connected && wallet.publicKey && connection) {
                fetchComputeBalance(connection, wallet.publicKey);
            }
            
            // Simulate network switching delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error switching network:', error);
            addToast(`Error switching network: ${error instanceof Error ? error.message : String(error)}`, 'error');
        } finally {
            setNetworkSwitching(false);
        }
    };

    // If not mounted yet (server-side), render a simpler version
    if (!isMounted) {
        return (
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800 py-3">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-sky-400">
                                AI NFT
                            </Link>
                            <div className="ml-10 hidden md:flex items-baseline space-x-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'px-3 py-2 rounded-md text-sm font-medium',
                                            pathname === item.href
                                                ? 'bg-sky-800 text-white'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                isScrolled
                    ? 'bg-black/80 backdrop-blur-lg border-b border-gray-800 py-3'
                    : 'bg-transparent py-5'
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                                AI NFT
                            </span>
                        </motion.div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        <nav className="flex items-center space-x-1">
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                            pathname === item.href
                                                ? 'bg-sky-800 text-white'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                </motion.div>
                            ))}
                        </nav>

                        {/* Network Selector Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    className={cn(
                                        "ml-2 text-sm border-gray-700 bg-gray-900/50 hover:bg-gray-800",
                                        networkSwitching && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={networkSwitching}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full mr-2",
                                        networkConfig[selectedNetwork].color
                                    )} />
                                    {networkConfig[selectedNetwork].name}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-900 border border-gray-700">
                                {Object.entries(networkConfig).map(([key, { name, color }]) => (
                                    <DropdownMenuItem
                                        key={key}
                                        className={cn(
                                            "flex items-center cursor-pointer hover:bg-gray-800",
                                            selectedNetwork === key && "bg-gray-800"
                                        )}
                                        onClick={() => handleNetworkChange(key as Network)}
                                    >
                                        <div className={cn("w-2 h-2 rounded-full mr-2", color)} />
                                        {name}
                                        {selectedNetwork === key && <Check className="ml-2 h-4 w-4" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Compute Token Balance */}
                        {wallet.connected && (
                            <div
                                className="flex items-center bg-gray-800/80 rounded-md px-3 py-1.5 ml-2 border-2 border-sky-700 cursor-pointer hover:bg-gray-700/80 transition-colors"
                                onClick={() => {
                                    if (computeBalance !== null) {
                                        addToast(`Compute balance: ${formatBalance(computeBalance)} tokens on ${selectedNetwork}`, 'info');
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

                        {/* Wallet Button */}
                        <div className="ml-2">
                            <WalletMultiButton />
                        </div>
                    </div>

                    {/* Mobile menu button and wallet */}
                    <div className="md:hidden flex items-center">
                        {/* Wallet Button - Mobile */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mr-2"
                        >
                            <WalletMultiButton />
                        </motion.div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMobileMenuOpen(!mobileMenuOpen);
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {mobileMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-gray-900 border-t border-gray-800 mobile-menu"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'block px-3 py-2 rounded-md text-base font-medium',
                                        pathname === item.href
                                            ? 'bg-sky-800 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    )}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}

                            {/* Network selector in mobile menu */}
                            <div className="px-3 py-2">
                                <p className="text-sm text-gray-400 mb-2">Network</p>
                                <div className="space-y-1">
                                    {Object.keys(networkConfig).map((network) => (
                                        <button
                                            key={network}
                                            onClick={() => handleNetworkChange(network as Network)}
                                            disabled={networkSwitching}
                                            className={cn(
                                                'flex items-center w-full text-left px-3 py-1.5 rounded-md text-sm',
                                                selectedNetwork === network
                                                    ? 'bg-gray-700 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                                networkSwitching && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            <span className={cn(
                                                "h-2 w-2 rounded-full mr-2",
                                                networkConfig[network as Network].color
                                            )} />
                                            {networkConfig[network as Network].name}
                                            {selectedNetwork === network && (
                                                <Check size={16} className="ml-auto" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {networkSwitching && (
                                    <p className="text-xs text-sky-400 mt-1 animate-pulse">
                                        Switching network...
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
} 