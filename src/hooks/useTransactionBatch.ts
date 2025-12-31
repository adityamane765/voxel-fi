'use client';

import { useState, useCallback } from 'react';
import { InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { useMovementWallet } from './useMovementWallet';

export interface BatchedTransaction {
  id: string;
  name: string;
  payload: InputEntryFunctionData;
  status: 'pending' | 'executing' | 'success' | 'error';
  hash?: string;
  error?: string;
}

export interface UseBatchTransactionReturn {
  // Queue management
  queue: BatchedTransaction[];
  addToQueue: (name: string, payload: InputEntryFunctionData) => string;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;

  // Execution
  executeAll: () => Promise<BatchResult>;
  executeNext: () => Promise<BatchedTransaction | null>;
  isExecuting: boolean;
  progress: { current: number; total: number };

  // Results
  results: BatchedTransaction[];
  hasErrors: boolean;
}

export interface BatchResult {
  success: boolean;
  completed: number;
  failed: number;
  transactions: BatchedTransaction[];
}

/**
 * Transaction Batching Hook
 *
 * Enables smooth UX for multi-step operations:
 * - Queue multiple transactions
 * - Execute sequentially with progress tracking
 * - Handle errors gracefully without stopping the batch
 * - Combine operations like: mint tokens → approve → create position
 */
export function useTransactionBatch(): UseBatchTransactionReturn {
  const wallet = useMovementWallet();
  const { signAndSubmitTransaction } = wallet;
  const isConnected = wallet.isConnected;
  const [queue, setQueue] = useState<BatchedTransaction[]>([]);
  const [results, setResults] = useState<BatchedTransaction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Generate unique ID for transactions
  const generateId = () => `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Add transaction to queue
  const addToQueue = useCallback((name: string, payload: InputEntryFunctionData): string => {
    const id = generateId();
    const transaction: BatchedTransaction = {
      id,
      name,
      payload,
      status: 'pending',
    };
    setQueue((prev) => [...prev, transaction]);
    return id;
  }, []);

  // Remove from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setResults([]);
    setProgress({ current: 0, total: 0 });
  }, []);

  // Execute next transaction in queue
  const executeNext = useCallback(async (): Promise<BatchedTransaction | null> => {
    const pendingTx = queue.find((tx) => tx.status === 'pending');
    if (!pendingTx || !isConnected) return null;

    // Update status to executing
    setQueue((prev) =>
      prev.map((tx) => (tx.id === pendingTx.id ? { ...tx, status: 'executing' as const } : tx))
    );

    try {
      const result = await signAndSubmitTransaction(pendingTx.payload);

      const completedTx: BatchedTransaction = {
        ...pendingTx,
        status: result.success ? 'success' : 'error',
        hash: result.hash,
        error: result.error,
      };

      setQueue((prev) => prev.map((tx) => (tx.id === pendingTx.id ? completedTx : tx)));
      setResults((prev) => [...prev, completedTx]);

      return completedTx;
    } catch (error) {
      const errorTx: BatchedTransaction = {
        ...pendingTx,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setQueue((prev) => prev.map((tx) => (tx.id === pendingTx.id ? errorTx : tx)));
      setResults((prev) => [...prev, errorTx]);

      return errorTx;
    }
  }, [queue, isConnected, signAndSubmitTransaction]);

  // Execute all transactions in queue
  const executeAll = useCallback(async (): Promise<BatchResult> => {
    if (!isConnected || queue.length === 0) {
      return {
        success: false,
        completed: 0,
        failed: 0,
        transactions: [],
      };
    }

    setIsExecuting(true);
    setProgress({ current: 0, total: queue.length });
    setResults([]);

    const completedTransactions: BatchedTransaction[] = [];
    let completed = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      setProgress({ current: i + 1, total: queue.length });

      const tx = queue[i];
      if (tx.status !== 'pending') continue;

      // Update status to executing
      setQueue((prev) =>
        prev.map((t) => (t.id === tx.id ? { ...t, status: 'executing' as const } : t))
      );

      try {
        const result = await signAndSubmitTransaction(tx.payload);

        const completedTx: BatchedTransaction = {
          ...tx,
          status: result.success ? 'success' : 'error',
          hash: result.hash,
          error: result.error,
        };

        setQueue((prev) => prev.map((t) => (t.id === tx.id ? completedTx : t)));
        completedTransactions.push(completedTx);

        if (result.success) {
          completed++;
        } else {
          failed++;
        }
      } catch (error) {
        const errorTx: BatchedTransaction = {
          ...tx,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        setQueue((prev) => prev.map((t) => (t.id === tx.id ? errorTx : t)));
        completedTransactions.push(errorTx);
        failed++;
      }

      // Small delay between transactions for better UX
      if (i < queue.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setResults(completedTransactions);
    setIsExecuting(false);

    return {
      success: failed === 0,
      completed,
      failed,
      transactions: completedTransactions,
    };
  }, [queue, isConnected, signAndSubmitTransaction]);

  // Check if any results have errors
  const hasErrors = results.some((tx) => tx.status === 'error');

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    executeAll,
    executeNext,
    isExecuting,
    progress,
    results,
    hasErrors,
  };
}

/**
 * Preset transaction batches for common operations
 */
export const TransactionPresets = {
  /**
   * Mint test tokens and create a position in one flow
   */
  mintAndCreatePosition: (
    moduleAddress: string,
    amountWeth: number,
    amountUsdc: number,
    priceCenter: number,
    spread: number,
    fractalType: number,
    depth: number
  ): { name: string; payload: InputEntryFunctionData }[] => [
    {
      name: 'Mint WETH',
      payload: {
        function: `${moduleAddress}::weth::mint`,
        typeArguments: [],
        functionArguments: [amountWeth * 1e8],
      },
    },
    {
      name: 'Mint USDC',
      payload: {
        function: `${moduleAddress}::usdc::mint`,
        typeArguments: [],
        functionArguments: [amountUsdc * 1e6],
      },
    },
    {
      name: 'Create Position',
      payload: {
        function: `${moduleAddress}::fractal_position::mint_position`,
        typeArguments: [],
        functionArguments: [
          Math.floor(amountWeth * 1e8),
          Math.floor(amountUsdc * 1e6),
          Math.floor(priceCenter * 1e8),
          Math.floor(spread * 1e4),
          fractalType,
          depth,
        ],
      },
    },
  ],

  /**
   * Claim fees and burn position in one flow
   */
  claimAndBurn: (
    moduleAddress: string,
    tokenAddress: string,
    marketPrice: number
  ): { name: string; payload: InputEntryFunctionData }[] => [
    {
      name: 'Claim Fees',
      payload: {
        function: `${moduleAddress}::fractal_position::claim_fees`,
        typeArguments: [],
        functionArguments: [tokenAddress, Math.floor(marketPrice * 1e8)],
      },
    },
    {
      name: 'Burn Position',
      payload: {
        function: `${moduleAddress}::fractal_position::burn_position`,
        typeArguments: [],
        functionArguments: [tokenAddress, Math.floor(marketPrice * 1e8)],
      },
    },
  ],
};
