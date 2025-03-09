'use client';

import { create } from 'zustand';
import { Connection } from '@solana/web3.js';
import { getClusterUrl, Network } from '../utils/anchor';
import { createJSONStorage, persist } from 'zustand/middleware';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define the network store state
interface NetworkState {
    network: Network;
    connection: Connection | null;
    setNetwork: (network: Network) => void;
}

// Default network
const defaultNetwork: Network = 'devnet';

// Create the network store
export const useNetworkStore = create<NetworkState>((set) => {
    // Get the default cluster URL
    const defaultClusterUrl = isBrowser ? getClusterUrl(defaultNetwork) : 'https://api.devnet.solana.com';

    return {
        network: defaultNetwork,
        // Initialize connection only in browser environment with a valid URL
        connection: isBrowser
            ? new Connection(defaultClusterUrl, 'confirmed')
            : null,
        setNetwork: (network: Network) => {
            // Get the cluster URL for the selected network
            const clusterUrl = isBrowser ? getClusterUrl(network) : 'https://api.devnet.solana.com';

            // Only create a new connection in browser environment with a valid URL
            const connection = isBrowser
                ? new Connection(clusterUrl, 'confirmed')
                : null;

            set({ network, connection });
        },
    };
}); 