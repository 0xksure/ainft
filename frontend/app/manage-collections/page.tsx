'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkStore } from '../stores/networkStore';
import { useAnchorProgram, getCreatorCollections, premintNft } from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import CopyableAddress from '../components/CopyableAddress';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';

type Collection = {
  address: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  mintPrice: number;
  totalSupply: number;
  mintCount: number;
  authority: PublicKey;
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
    if (!program || !wallet.publicKey) return;
    
    try {
      setLoadingCollections(true);
      const collections = await getCreatorCollections(program, wallet.publicKey);
      setCollections(collections);
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

    if (!program || !wallet.publicKey || !selectedCollection) {
      setError("Program, wallet, or collection not available");
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
        selectedCollection.address,
        nftName,
        nftUri,
        selectedCollection.name,
        selectedCollection.mintPrice
      );

      setPremintTxHash(result.txId);
      setPremintedNftAddress(result.nftMint.toString());

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
                      href={`https://explorer.solana.com/tx/${premintTxHash}?cluster=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View on Solana Explorer
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
                      key={collection.address.toString()} 
                      className={cn(
                        "bg-gray-800 p-6 rounded-lg cursor-pointer transition-all",
                        selectedCollection?.address.equals(collection.address) 
                          ? "ring-2 ring-purple-500" 
                          : "hover:bg-gray-700"
                      )}
                      onClick={() => setSelectedCollection(collection)}
                    >
                      <div className="aspect-square bg-gray-700 rounded-lg mb-4 relative overflow-hidden">
                        <Image
                          src={collection.uri}
                          alt={collection.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            // Fallback for image error
                            e.currentTarget.src = "/placeholder-collection.png";
                          }}
                        />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>Symbol: {collection.symbol}</p>
                        <p>Mint Price: {collection.mintPrice / 1_000_000_000} SOL</p>
                        <p>Supply: {collection.mintCount} / {collection.totalSupply}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Premint Form (only shown when a collection is selected) */}
              {selectedCollection && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">Premint NFT for {selectedCollection.name}</h2>
                    <p className="text-gray-400 mb-6">
                      Premint NFTs for your collection that users can purchase and customize.
                    </p>
                    <form className="space-y-6" onSubmit={handlePremintSubmit}>
                      <div>
                        <label className="block mb-2">NFT Name</label>
                        <input
                          type="text"
                          value={nftName}
                          onChange={(e) => setNftName(e.target.value)}
                          className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter a name for this NFT"
                          required
                        />
                      </div>

                      <div>
                        <label className="block mb-2">NFT Image URL</label>
                        <input
                          type="text"
                          value={nftUri}
                          onChange={handleUrlChange}
                          className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="https://example.com/your-nft-image"
                          required
                        />
                        <p className="text-sm text-gray-400 mt-1">
                          Enter the URL for this NFT's image
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isPreminting}
                        className={cn(
                          "w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded font-medium transition-all",
                          isPreminting ? "opacity-70 cursor-not-allowed" : "hover:from-purple-700 hover:to-blue-700"
                        )}
                      >
                        {isPreminting ? "Preminting NFT..." : "Premint NFT"}
                      </button>
                    </form>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">Preview</h2>
                    <div className="aspect-square bg-gray-700 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                      {previewUrl ? (
                        <div className="relative w-full h-full">
                          {!imageError ? (
                            <Image
                              src={previewUrl}
                              alt={nftName || "NFT Image"}
                              fill
                              style={{ objectFit: 'cover' }}
                              onError={handleImageError}
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                              <p className="text-gray-400 mb-2">URL entered but image couldn't be displayed</p>
                              <div className="bg-gray-900 p-3 rounded-md w-full max-w-xs overflow-hidden">
                                <p className="text-xs text-gray-400 truncate">{previewUrl}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <p className="text-gray-400">Enter a valid URL to see a preview</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-900/30 rounded-lg">
                        <h3 className="font-semibold mb-2">About Preminting</h3>
                        <p className="text-sm text-gray-300">
                          Preminting allows you to create NFTs in advance that users can purchase.
                          Each NFT can be customized with different AI character settings by its owner.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold">Collection: {selectedCollection.name}</p>
                        <p className="font-semibold">Mint Price: {selectedCollection.mintPrice / 1_000_000_000} SOL</p>
                        <p className="font-semibold">Preminted: {selectedCollection.mintCount} / {selectedCollection.totalSupply}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
