'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Aptos, AptosConfig, Network, InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { config } from '@/config';

// Initialize Aptos client for Movement
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: config.movement.rpc,
});
const aptos = new Aptos(aptosConfig);

export interface WalletState {
  isAuthenticated: boolean;
  isLoading: boolean;
  address: string | null;
  walletType: 'embedded' | 'external' | null;
  user: {
    email?: string;
    google?: { email: string };
    twitter?: { username: string };
    discord?: { username: string };
  } | null;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface UseMovementWalletReturn {
  // Auth state
  isAuthenticated: boolean;
  isReady: boolean;
  isLoading: boolean;
  isConnected: boolean;
  address: string | null;
  user: WalletState['user'];

  // Auth actions
  login: () => void;
  logout: () => Promise<void>;

  // Transaction methods
  signAndSubmitTransaction: (payload: InputEntryFunctionData) => Promise<TransactionResult>;
  signMessage: (message: string) => Promise<{ signature: string } | null>;

  // Utility
  getExplorerUrl: (hash: string) => string;
  shortenAddress: (addr: string) => string;
}

/**
 * Custom hook for Movement Network wallet integration with Privy
 *
 * This hook provides:
 * - Social login (email, Google, Twitter, Discord)
 * - Automatic embedded wallet creation
 * - Transaction signing and submission to Movement
 * - Seamless UX without wallet extensions
 */
export function useMovementWallet(): UseMovementWalletReturn {
  const { ready, authenticated, user, login, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();

  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [embeddedWallet, setEmbeddedWallet] = useState<any>(null);

  // Find the embedded wallet
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      // Look for Privy embedded wallet (first one is usually embedded)
      const wallet = wallets.find((w) => w.walletClientType === 'privy');

      if (wallet) {
        setEmbeddedWallet(wallet);
        // For Aptos/Movement, we need to derive or get the address
        // The wallet object structure may vary based on Privy version
        const walletAddress = (wallet as any).address;
        if (walletAddress) {
          setAddress(walletAddress);
        }
      } else if (wallets.length > 0) {
        // Fallback to first wallet
        const firstWallet = wallets[0];
        setEmbeddedWallet(firstWallet);
        const walletAddress = (firstWallet as any).address;
        if (walletAddress) {
          setAddress(walletAddress);
        }
      }
    } else {
      setEmbeddedWallet(null);
      setAddress(null);
    }
  }, [authenticated, wallets]);

  // Logout
  const logout = useCallback(async () => {
    await privyLogout();
    setAddress(null);
    setEmbeddedWallet(null);
  }, [privyLogout]);

  // Sign and submit transaction to Movement
  const signAndSubmitTransaction = useCallback(
    async (payload: InputEntryFunctionData): Promise<TransactionResult> => {
      if (!embeddedWallet || !address) {
        return { success: false, error: 'Wallet not connected' };
      }

      setIsLoading(true);
      try {
        // Build the transaction
        const transaction = await aptos.transaction.build.simple({
          sender: address,
          data: {
            function: payload.function as `${string}::${string}::${string}`,
            typeArguments: (payload.typeArguments as string[]) || [],
            functionArguments: payload.functionArguments || [],
          },
        });

        // Sign with Privy embedded wallet
        // Note: The exact signing method depends on Privy's Aptos support
        let signedTx;
        if (typeof embeddedWallet.signTransaction === 'function') {
          signedTx = await embeddedWallet.signTransaction(transaction);
        } else {
          // Fallback: Try to use the wallet's sign method
          throw new Error('Wallet does not support transaction signing');
        }

        // Submit to Movement
        const pendingTx = await aptos.transaction.submit.simple({
          transaction,
          senderAuthenticator: signedTx,
        });

        // Wait for confirmation
        await aptos.waitForTransaction({ transactionHash: pendingTx.hash });

        return { success: true, hash: pendingTx.hash };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transaction failed';
        console.error('Transaction error:', error);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [embeddedWallet, address]
  );

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<{ signature: string } | null> => {
      if (!embeddedWallet) return null;

      try {
        if (typeof embeddedWallet.signMessage === 'function') {
          const signature = await embeddedWallet.signMessage({ message });
          return { signature };
        }
        return null;
      } catch (error) {
        console.error('Sign message error:', error);
        return null;
      }
    },
    [embeddedWallet]
  );

  // Get explorer URL
  const getExplorerUrl = useCallback((hash: string) => {
    const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}`;
    return `${config.movement.explorerUrl}/txn/${formattedHash}?network=testnet`;
  }, []);

  // Shorten address for display
  const shortenAddress = useCallback((addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Extract user info
  const userInfo = user
    ? {
        email: user.email?.address,
        google: user.google ? { email: user.google.email } : undefined,
        twitter: user.twitter ? { username: user.twitter.username || '' } : undefined,
        discord: user.discord ? { username: user.discord.username || '' } : undefined,
      }
    : null;

  // Combined connection state
  const isConnected = authenticated && !!address;

  return {
    // Auth state
    isAuthenticated: authenticated,
    isReady: ready,
    isLoading,
    isConnected,
    address,
    user: userInfo,

    // Auth actions
    login,
    logout,

    // Transaction methods
    signAndSubmitTransaction,
    signMessage,

    // Utility
    getExplorerUrl,
    shortenAddress,
  };
}
