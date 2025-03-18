'use client';

import { create } from 'zustand';
import { Connection, PublicKey } from '@solana/web3.js';
import { getComputeTokenBalance } from '../utils/anchor';
import { persist } from 'zustand/middleware';

// Define the compute balance store state
interface ComputeBalanceState {
  balance: number | null;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
  fetchBalance: (connection: Connection, walletPublicKey: PublicKey) => Promise<void>;
  setBalance: (balance: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the compute balance store
export const useComputeBalanceStore = create<ComputeBalanceState>((set) => ({
  balance: null,
  isLoading: false,
  lastUpdated: null,
  error: null,

  // Fetch the compute token balance
  fetchBalance: async (connection: Connection, walletPublicKey: PublicKey) => {
    if (!connection || !walletPublicKey) {
      set({ error: 'Connection or wallet not initialized' });
      return;
    }

    set({ isLoading: true, error: null });
    console.log('Fetching compute balance from store for wallet:', walletPublicKey.toString());

    try {
      const balance = await getComputeTokenBalance(connection, walletPublicKey);
      console.log('Compute balance from store:', balance);
      set({ 
        balance, 
        isLoading: false, 
        lastUpdated: Date.now(),
        error: null
      });
    } catch (error) {
      console.error('Error fetching compute balance:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Set the balance directly
  setBalance: (balance: number) => {
    set({ 
      balance, 
      lastUpdated: Date.now(),
      error: null
    });
  },

  // Set loading state
  setIsLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error, isLoading: false });
  }
}));
