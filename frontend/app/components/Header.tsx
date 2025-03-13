'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNetworkStore } from '../stores/networkStore';
import { Network } from '../utils/anchor';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import { Menu, X, ChevronDown, Check } from 'lucide-react';
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
    const { network: selectedNetwork, setNetwork } = useNetworkStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [networkSwitching, setNetworkSwitching] = useState(false);

    // Set mounted state on client-side
    useEffect(() => {
        setIsMounted(true);
    }, []);

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
            // Simulate network switching delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error switching network:', error);
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

                        {/* Network Selector */}
                        <div className="relative ml-4">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className={cn(
                                                "flex items-center gap-1 transition-all",
                                                networkSwitching && "animate-pulse"
                                            )}
                                            disabled={networkSwitching}
                                        >
                                            <span className={cn(
                                                "h-2 w-2 rounded-full mr-1",
                                                networkConfig[selectedNetwork as Network].color || 'bg-gray-500'
                                            )} />
                                            <span>
                                                {networkSwitching
                                                    ? "Switching..."
                                                    : (networkConfig[selectedNetwork as Network].name || selectedNetwork)
                                                }
                                            </span>
                                            <ChevronDown size={16} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-48">
                                        {Object.keys(networkConfig).map((network) => (
                                            <DropdownMenuItem
                                                key={network}
                                                onClick={() => handleNetworkChange(network as Network)}
                                                className="flex items-center"
                                            >
                                                <span className={cn(
                                                    "h-2 w-2 rounded-full mr-2",
                                                    networkConfig[network as Network].color
                                                )} />
                                                {networkConfig[network as Network].name}
                                                {selectedNetwork === network as Network && (
                                                    <Check size={16} className="ml-auto" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </motion.div>
                        </div>

                        {/* Wallet Button - Desktop */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="ml-4"
                        >
                            <WalletMultiButton />
                        </motion.div>
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