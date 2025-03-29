'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';

interface CopyableAddressProps {
  address: PublicKey | string;
  length?: 'short' | 'medium' | 'full';
  className?: string;
}

export const CopyableAddress: React.FC<CopyableAddressProps> = ({
  address,
  length = 'short',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  
  const addressStr = typeof address === 'string' ? address : address.toString();
  
  let displayAddress = addressStr;
  if (length === 'short') {
    displayAddress = `${addressStr.substring(0, 4)}...${addressStr.substring(addressStr.length - 4)}`;
  } else if (length === 'medium') {
    displayAddress = `${addressStr.substring(0, 8)}...${addressStr.substring(addressStr.length - 8)}`;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(addressStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address to clipboard', err);
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className="font-mono">{displayAddress}</span>
      <button
        onClick={copyToClipboard}
        className="ml-1.5 text-gray-400 hover:text-sky-400 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default CopyableAddress;
