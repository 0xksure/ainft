'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useNetworkStore } from '../stores/networkStore';
import { getClusterUrl } from '../utils/anchor';

// Import the wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

interface WalletContextProviderProps {
    children: ReactNode;
}

const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
    // Get the network from the store
    const { network, connection } = useNetworkStore();

    // Only create wallet adapters in browser environment
    const wallets = useMemo(() => {
        if (!isBrowser) return [];

        return [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ];
    }, []);

    // Get the endpoint from the connection or use a default
    const endpoint = useMemo(() => {
        // If not in browser, use a default devnet URL
        if (!isBrowser) return 'https://api.devnet.solana.com';

        // If connection exists, use its rpcEndpoint
        if (connection && connection.rpcEndpoint) {
            // Ensure the endpoint starts with http: or https:
            if (connection.rpcEndpoint.startsWith('http://') || connection.rpcEndpoint.startsWith('https://')) {
                return connection.rpcEndpoint;
            }
        }

        // Fallback to default URL for the current network
        return getClusterUrl(network);
    }, [connection, network]);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={isBrowser}>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContextProvider; 