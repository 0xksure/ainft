/**
 * Returns the correct explorer URL for a given path and network
 * 
 * @param path The explorer path ('tx' or 'address')
 * @param signature The transaction signature or address
 * @param network The network name
 * @returns The explorer URL
 */
export const getExplorerUrl = (path: string, signature: string, network: string): string => {
    // Use Sonic Explorer for sonic networks
    if (network.startsWith('sonic-')) {
        return `https://explorer.sonic.game/${path}/${signature}?cluster=testnet.v1`;
    }
    // Default to Solana Explorer for other networks
    return `https://explorer.solana.com/${path}/${signature}?cluster=${network}`;
};

/**
 * Returns the explorer name based on the network
 * 
 * @param network The network name
 * @returns The explorer name
 */
export const getExplorerName = (network: string): string => {
    return network.startsWith('sonic-') ? 'Sonic' : 'Solana';
}; 