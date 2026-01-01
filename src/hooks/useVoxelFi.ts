'use client';

import { useState, useCallback } from 'react';
import { InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { useMovementWallet } from './useMovementWallet';
import {
  aptos,
  buildMintPositionPayload,
  buildBurnPositionPayload,
  buildClaimFeesPayload,
  buildSwapPayload,
  buildSwapYForXPayload,
  buildRegisterWethPayload,
  buildRegisterUsdcPayload,
  getPositionData,
  getUnclaimedFees,
  getReserves,
  getSwapQuote,
  getCurrentMarketPrice,
  parsePositionMintedEvent,
  getTokenBalances as fetchTokenBalances,
  PositionData,
  SwapQuote,
} from '@/services/aptos';
import { usePositionStorage, StoredPosition } from './usePositionStorage';
import { config } from '@/config';

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  tokenAddress?: string;
}

export interface UseVoxelFiReturn {
  // Auth & Wallet state
  isAuthenticated: boolean;
  isReady: boolean;
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  user: {
    email?: string;
    google?: { email: string };
    twitter?: { username: string };
    discord?: { username: string };
  } | null;

  // Auth actions (Privy)
  login: () => void;
  logout: () => Promise<void>;

  // Setup operations (register coin stores)
  registerTokens: () => Promise<TransactionResult>;

  // Position operations
  mintPosition: (params: MintPositionParams) => Promise<TransactionResult>;
  burnPosition: (tokenAddress: string) => Promise<TransactionResult>;
  claimFees: (tokenAddress: string) => Promise<TransactionResult>;

  // Swap operations
  swap: (amountIn: number, minAmountOut: number, direction: 'xToY' | 'yToX') => Promise<TransactionResult>;

  // View operations
  getPosition: (tokenAddress: string) => Promise<PositionData | null>;
  getSwapQuote: (amountIn: number, slippageBps?: number) => Promise<SwapQuote>;
  getMarketPrice: () => Promise<number>;
  getVaultReserves: () => Promise<{ reserveX: number; reserveY: number }>;
  getPositionFees: (tokenAddress: string) => Promise<{ feesX: number; feesY: number }>;
  getTokenBalances: () => Promise<{ weth: number; usdc: number }>;

  // Stored positions
  storedPositions: StoredPosition[];
  refreshPositions: () => Promise<void>;

  // Utilities
  getExplorerUrl: (hash: string) => string;
  shortenAddress: (addr: string) => string;
}

export interface MintPositionParams {
  amountX: number;
  amountY: number;
  priceCenter: number;
  spread: number;
  fractalType: number;
  depth: number;
  pair?: string;
  fractalTypeName?: string;
}

/**
 * Main hook for VoxelFi operations
 *
 * Combines:
 * - Privy authentication & embedded wallets
 * - Movement transaction signing
 * - VoxelFi contract interactions
 * - Position management
 */
export function useVoxelFi(): UseVoxelFiReturn {
  const {
    isAuthenticated,
    isReady,
    isLoading: walletLoading,
    address,
    user,
    login,
    logout,
    signAndSubmitTransaction,
    getExplorerUrl,
    shortenAddress,
  } = useMovementWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { positions: storedPositions, addPosition, removePosition } = usePositionStorage();

  // Combined connection state
  const isConnected = isAuthenticated && !!address;

  // Execute transaction helper
  const executeTransaction = useCallback(
    async (payload: InputEntryFunctionData): Promise<TransactionResult> => {
      if (!isConnected) {
        return { success: false, error: 'Please sign in first' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await signAndSubmitTransaction(payload);

        if (!result.success) {
          setError(result.error || 'Transaction failed');
          return result;
        }

        // Try to extract NFT address from events if this was a mint
        let tokenAddress: string | undefined;
        if (result.hash) {
          try {
            const tx = await aptos.getTransactionByHash({ transactionHash: result.hash });
            if ('events' in tx && Array.isArray(tx.events)) {
              tokenAddress = parsePositionMintedEvent(tx.events) || undefined;
            }
          } catch (e) {
            console.log('Could not parse events:', e);
          }
        }

        return { ...result, tokenAddress };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, signAndSubmitTransaction]
  );

  // Register token coin stores (must be called before receiving tokens)
  const registerTokens = useCallback(async (): Promise<TransactionResult> => {
    // Register WETH first
    const wethResult = await executeTransaction(buildRegisterWethPayload());
    if (!wethResult.success) {
      // If it fails with "already registered" that's fine, continue
      if (!wethResult.error?.includes('ECOIN_STORE_ALREADY_PUBLISHED')) {
        return wethResult;
      }
    }

    // Register USDC
    const usdcResult = await executeTransaction(buildRegisterUsdcPayload());
    if (!usdcResult.success) {
      if (!usdcResult.error?.includes('ECOIN_STORE_ALREADY_PUBLISHED')) {
        return usdcResult;
      }
    }

    return { success: true };
  }, [executeTransaction]);

  // Mint position
  const mintPosition = useCallback(
    async (params: MintPositionParams): Promise<TransactionResult> => {
      const payload = buildMintPositionPayload(
        params.amountX,
        params.amountY,
        params.priceCenter,
        params.spread,
        params.fractalType,
        params.depth
      );

      const result = await executeTransaction(payload);

      // Store the position if successful
      if (result.success && result.tokenAddress) {
        const fractalTypeName =
          params.fractalTypeName || config.fractalTypes[params.fractalType]?.name || 'Unknown';
        addPosition({
          tokenAddress: result.tokenAddress,
          positionId: Date.now(),
          createdAt: Date.now(),
          pair: params.pair || 'WETH/USDC',
          fractalType: fractalTypeName,
        });
      }

      return result;
    },
    [executeTransaction, addPosition]
  );

  // Burn position
  const burnPosition = useCallback(
    async (tokenAddress: string): Promise<TransactionResult> => {
      const marketPrice = await getCurrentMarketPrice();
      const payload = buildBurnPositionPayload(tokenAddress, marketPrice);
      const result = await executeTransaction(payload);

      if (result.success) {
        removePosition(tokenAddress);
      }

      return result;
    },
    [executeTransaction, removePosition]
  );

  // Claim fees
  const claimFees = useCallback(
    async (tokenAddress: string): Promise<TransactionResult> => {
      const marketPrice = await getCurrentMarketPrice();
      const payload = buildClaimFeesPayload(tokenAddress, marketPrice);
      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  // Swap tokens
  const swap = useCallback(
    async (
      amountIn: number,
      minAmountOut: number,
      direction: 'xToY' | 'yToX'
    ): Promise<TransactionResult> => {
      const payload =
        direction === 'xToY'
          ? buildSwapPayload(amountIn, minAmountOut)
          : buildSwapYForXPayload(amountIn, minAmountOut);
      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  // View functions
  const getPosition = useCallback(async (tokenAddress: string) => {
    return getPositionData(tokenAddress);
  }, []);

  const getQuote = useCallback(async (amountIn: number, slippageBps?: number) => {
    return getSwapQuote(amountIn, slippageBps);
  }, []);

  const getMarketPrice = useCallback(async () => {
    return getCurrentMarketPrice();
  }, []);

  const getVaultReserves = useCallback(async () => {
    return getReserves();
  }, []);

  const getPositionFees = useCallback(async (tokenAddress: string) => {
    const marketPrice = await getCurrentMarketPrice();
    return getUnclaimedFees(tokenAddress, marketPrice);
  }, []);

  const getTokenBalances = useCallback(async () => {
    if (!address) return { weth: 0, usdc: 0 };
    return fetchTokenBalances(address);
  }, [address]);

  const refreshPositions = useCallback(async () => {
    console.log('Refreshing positions...');
  }, []);

  return {
    // Auth & Wallet state
    isAuthenticated,
    isReady,
    isConnected,
    address,
    isLoading: isLoading || walletLoading,
    error,
    user,

    // Auth actions
    login,
    logout,

    // Setup operations
    registerTokens,

    // Position operations
    mintPosition,
    burnPosition,
    claimFees,

    // Swap operations
    swap,

    // View operations
    getPosition,
    getSwapQuote: getQuote,
    getMarketPrice,
    getVaultReserves,
    getPositionFees,
    getTokenBalances,

    // Stored positions
    storedPositions,
    refreshPositions,

    // Utilities
    getExplorerUrl,
    shortenAddress,
  };
}
