'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import { useAnchorProgram, fetchCollections, premintNft } from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import CopyableAddress from '../components/CopyableAddress';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { getExplorerUrl, getExplorerName } from '../utils/explorer';

type Collection = {
  address?: PublicKey;
  publicKey: PublicKey;  // This is the primary key in the returned collections
  authority: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  mint: PublicKey;
  description?: string;
  mintPrice: any; // Using any for BN type
  totalSupply?: any; // Using any for BN type, optional now
  maxSupply?: any; // Optional alternative to totalSupply
  mintCount: any; // Using any for BN type
  royaltyBasisPoints: number;
  startMintDate?: any; // New field
  endMintDate?: any; // New field
  bump?: any;
};

export default function ManageCollectionsPage() {
  const wallet = useWallet();
  const { network, connection } = useNetworkStore();
  const router = useRouter();

  const { program, loading: programLoading, error: programError } = useAnchorProgram();
  const [isClient, setIsClient] = useState(false);

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // Premint NFT form state
  const [nftName, setNftName] = useState('');
  const [nftUri, setNftUri] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreminting, setIsPreminting] = useState(false);
  const [premintTxHash, setPremintTxHash] = useState<string | null>(null);
  const [premintedNftAddress, setPremintedNftAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load collections when wallet and program are ready
  useEffect(() => {
    if (isClient && wallet.publicKey && program && !programLoading) {
      loadCollections();
    }
  }, [isClient, wallet.publicKey, program, programLoading]);

  const loadCollections = async () => {
    if (!program || !wallet.publicKey || !connection) return;

    try {
      setLoadingCollections(true);
      const fetchedCollections = await fetchCollections(program, connection, wallet.publicKey);

      // Safely map the returned collections to match our Collection type
      const mappedCollections = fetchedCollections.map(collection => {
        // Use type assertion to avoid property access errors
        const collectionAny = collection as any;

        // Safe conversion function with fallback
        const safeToNumber = (bnValue: any) => {
          try {
            return bnValue && typeof bnValue.toNumber === 'function' ? bnValue.toNumber() : 0;
          } catch (err) {
            console.warn('Error converting BN to number:', err);
            return 0;
          }
        };

        // Safely extract all properties with fallbacks
        return {
          publicKey: collection.publicKey,
          address: collection.publicKey, // For backward compatibility
          authority: collection.authority,
          name: collection.name || 'Unnamed Collection',
          symbol: collection.symbol || '',
          uri: collection.uri || '',
          mint: collection.mint,
          description: collectionAny.description || '',
          royaltyBasisPoints: collection.royaltyBasisPoints || 0,
          mintPrice: safeToNumber(collection.mintPrice),
          mintCount: safeToNumber(collection.mintCount),
          totalSupply: safeToNumber(collectionAny.totalSupply || collectionAny.maxSupply),
          startMintDate: safeToNumber(collectionAny.startMintDate),
          endMintDate: safeToNumber(collectionAny.endMintDate)
        };
      });

      setCollections(mappedCollections);
    } catch (err) {
      console.error('Error loading collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoadingCollections(false);
    }
  };

  // Handle URL input and validation
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNftUri(value);

    // Basic URL validation
    try {
      if (value) {
        new URL(value);
        setPreviewUrl(value);
        setImageError(false); // Reset image error state
      } else {
        setPreviewUrl('');
      }
    } catch (err) {
      setPreviewUrl('');
    }
  };

  // Image error handler
  const handleImageError = () => {
    console.log('Image failed to load:', previewUrl);
    setImageError(true);
  };

  // Handle premint form submission
  const handlePremintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!program || !wallet.publicKey || !selectedCollection || !connection) {
      setError("Program, wallet, connection, or collection not available");
      return;
    }

    try {
      setIsPreminting(true);
      setError(null);

      // Premint NFT
      const result = await premintNft(
        program,
        wallet,
        connection,
        selectedCollection.name, // Collection name as string
        nftName, // NFT name
        nftUri, // NFT URI
        selectedCollection.mintPrice, // Price (number)
        undefined // No character config ID
      );

      setPremintTxHash(result.txId);
      setPremintedNftAddress(result.nftMintAddress.toString());

      // Reset form
      setNftName('');
      setNftUri('');
      setPreviewUrl('');

      // Refresh collections to update mint count
      await loadCollections();

    } catch (err) {
      console.error('Error preminting NFT:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsPreminting(false);
    }
  };

  // Only render wallet-dependent content on the client
  if (!isClient) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Manage AI NFT Collections</h1>
          <p>Loading wallet connection...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage AI NFT Collections</h1>
            <Link
              href="/create-collection"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Create New Collection
            </Link>
          </div>

          {!wallet.publicKey ? (
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <p className="text-xl mb-4">Connect your wallet to manage your AI NFT Collections</p>
              <p>Please use the wallet button in the header to connect.</p>
            </div>
          ) : programLoading || loadingCollections ? (
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <p className="text-xl mb-4">Loading collections...</p>
              <div className="animate-pulse h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ) : programError ? (
            <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
              <p className="text-xl mb-4">Error loading program</p>
              <p>{programError.message}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Success message for preminted NFT */}
              {premintTxHash && premintedNftAddress && (
                <div className="bg-green-900/50 border border-green-700 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold mb-4">NFT Preminted Successfully!</h2>
                  <p className="mb-2">Your AI NFT has been preminted on the {network} network.</p>
                  <p className="mb-4">
                    <span className="font-semibold">NFT Mint Address:</span>{' '}
                    <code className="bg-black/30 px-2 py-1 rounded">{premintedNftAddress}</code>
                  </p>
                  <p>
                    <span className="font-semibold">Transaction:</span>{' '}
                    <a
                      href={getExplorerUrl('tx', premintTxHash, network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View on {getExplorerName(network)} Explorer
                    </a>
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Error</h2>
                  <p>{error}</p>
                </div>
              )}

              {/* Collections List */}
              {collections.length === 0 ? (
                <div className="bg-gray-800 p-6 rounded-lg mb-8 text-center">
                  <p className="text-xl mb-4">You don't have any collections yet</p>
                  <Link
                    href="/create-collection"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all inline-block"
                  >
                    Create Your First Collection
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {collections.map((collection, index) => (
                    <div
                      key={collection.publicKey.toString()}
                      className={cn(
                        "bg-gray-800 p-6 rounded-lg cursor-pointer transition-all hover:bg-gray-700 hover:shadow-lg hover:translate-y-[-4px]",
                        "border border-gray-700 hover:border-purple-500"
                      )}
                      onClick={() => router.push(`/manage-collections/${collection.publicKey.toString()}`)}
                    >
                      <div className="aspect-square bg-gray-700 rounded-lg mb-4 relative overflow-hidden">
                        <img
                          src={collection.uri}
                          alt={collection.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback for image error
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = "/placeholder-collection.png";
                          }}
                        />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>Symbol: {collection.symbol}</p>
                        <p>Mint Price: {collection.mintPrice / 1_000_000_000} SOL</p>
                        <p className="flex items-center">
                          <span className="inline-block mr-2">
                            Supply: {collection.mintCount} {collection.totalSupply > 0 ? `/ ${collection.totalSupply}` : '(Unlimited)'}
                          </span>
                          {collection.mintCount > 0 && (
                            <span className="text-xs inline-flex items-center bg-purple-900/50 px-2 py-1 rounded-full">
                              {collection.mintCount} preminted
                            </span>
                          )}
                        </p>
                        {collection.startMintDate > 0 && (
                          <p>Start Date: {new Date(collection.startMintDate * 1000).toLocaleString()}</p>
                        )}
                        {collection.endMintDate > 0 && (
                          <p>End Date: {new Date(collection.endMintDate * 1000).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                        <button
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center transition-colors"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent div's onClick
                            router.push(`/manage-collections/${collection.publicKey.toString()}`);
                          }}
                        >
                          Manage NFTs <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
