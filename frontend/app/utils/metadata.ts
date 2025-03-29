import { PublicKey, Connection } from '@solana/web3.js';
import { programs } from '@metaplex/js';
import { Program } from '@coral-xyz/anchor';
import * as splToken from '@solana/spl-token';

/**
 * Converts a byte array to a string, removing trailing zeros
 * @param bytes The byte array to convert
 * @returns The string representation
 */
export const bytesToString = (bytes: number[]): string => {
    // Find the first zero byte or use the full length
    const zeroIndex = bytes.findIndex(byte => byte === 0);
    const length = zeroIndex >= 0 ? zeroIndex : bytes.length;

    // Convert the bytes to a string
    return String.fromCharCode(...bytes.slice(0, length));
};

/**
 * Converts a 2D byte array to an array of strings
 * @param byteArrays The 2D byte array to convert
 * @returns Array of strings
 */
export const bytesArrayToStrings = (byteArrays: number[][]): string[] => {
    return byteArrays
        .map(bytes => bytesToString(bytes))
        .filter(str => str.length > 0); // Filter out empty strings
};

/**
 * Gets the metadata PDA for a given mint address
 * @param mint The mint address to get metadata for
 * @returns The metadata PDA
 */
export const getMetadataPda = async (mint: PublicKey): Promise<PublicKey> => {
    const { metadata: { Metadata } } = programs;
    return await Metadata.getPDA(mint);
};

/**
 * Fetches metadata for a given mint address
 * @param connection The Solana connection
 * @param mint The mint address to fetch metadata for
 * @returns The metadata for the mint
 */
export const fetchMetadata = async (connection: Connection, mint: PublicKey) => {
    const { metadata: { Metadata } } = programs;
    const metadataPDA = await getMetadataPda(mint);
    return await Metadata.load(connection, metadataPDA);
};

/**
 * Fetches an AI Character NFT and its metadata
 * @param program The Anchor program
 * @param connection The Solana connection
 * @param address The NFT account address
 * @returns The NFT data with metadata
 */
export const fetchAiCharacterNft = async (program: any, connection: Connection, address: string) => {
    const nftPubkey = new PublicKey(address);
    const nftAccount = await program.account.aiCharacterNft.fetch(nftPubkey);
    const { metadata: { Metadata } } = programs;

    // Get NFT metadata
    const metadataPDA = await getMetadataPda(nftAccount.characterNftMint);
    const tokenMetadata = await Metadata.load(connection, metadataPDA);
    const mint = nftAccount.characterNftMint;

    // Find the owner of the NFT
    let owner = new PublicKey('11111111111111111111111111111111'); // Default to system program address
    
    try {
        // Get the largest token accounts for this mint
        const tokenAccounts = await connection.getTokenLargestAccounts(mint);
        
        if (tokenAccounts.value.length > 0) {
            // Get the token account with the largest balance (should be 1 for NFTs)
            const largestAccount = tokenAccounts.value[0];
            
            // Get the parsed account info
            const accountInfo = await connection.getParsedAccountInfo(largestAccount.address);
            
            if (accountInfo.value && 'parsed' in accountInfo.value.data) {
                const parsedData = accountInfo.value.data.parsed;
                if (parsedData.info && parsedData.info.owner) {
                    owner = new PublicKey(parsedData.info.owner);
                }
            }
        }
    } catch (error) {
        console.error('Error finding NFT owner:', error);
    }

    // Parse the character config from byte arrays to strings
    return {
        address: address,
        name: bytesToString(Array.from(nftAccount.name)) || 'Unnamed AI',
        characterConfig: {
            name: bytesToString(Array.from(nftAccount.characterConfig.name)),
            clients: bytesArrayToStrings(nftAccount.characterConfig.clients.map((c: any) => Array.from(c))),
            modelProvider: bytesToString(Array.from(nftAccount.characterConfig.modelProvider)),
            settings: {
                voice: {
                    model: bytesToString(Array.from(nftAccount.characterConfig.settings.voice.model))
                }
            },
            bio: bytesArrayToStrings(nftAccount.characterConfig.bio.map((b: any) => Array.from(b))),
            lore: bytesArrayToStrings(nftAccount.characterConfig.lore.map((l: any) => Array.from(l))),
            knowledge: bytesArrayToStrings(nftAccount.characterConfig.knowledge.map((k: any) => Array.from(k))),
            topics: bytesArrayToStrings(nftAccount.characterConfig.topics.map((t: any) => Array.from(t))),
            style: {
                tone: bytesToString(Array.from(nftAccount.characterConfig.style.all[0])),
                writing: bytesToString(Array.from(nftAccount.characterConfig.style.all[1]))
            },
            adjectives: bytesArrayToStrings(nftAccount.characterConfig.adjectives.map((a: any) => Array.from(a)))
        },
        owner: owner,
        imageUrl: tokenMetadata.data.data.uri,
        executionClient: nftAccount.executionClient || undefined
    };
}; 