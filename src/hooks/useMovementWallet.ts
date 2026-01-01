'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash, useCreateWallet } from '@privy-io/react-auth/extended-chains';
import {
  Aptos,
  AptosConfig,
  Network,
  InputEntryFunctionData,
  generateSigningMessageForTransaction,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
} from '@aptos-labs/ts-sdk';
import { config } from '@/config';

// Initialize Aptos client for Movement
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: config.movement.rpc,
});
const aptos = new Aptos(aptosConfig);

// Helper to convert Uint8Array to hex
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface WalletState {
  isAuthenticated: boolean;
  isLoading: boolean;
  address: string | null;
  publicKey: string | null;
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
  publicKey: string | null;
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
 * Uses the pattern from: https://github.com/Rahat-ch/fucks-or-sucks
 * - Finds Aptos wallet from user.linkedAccounts
 * - Uses signRawHash for transaction signing
 * - Direct submission to Movement testnet
 */
export function useMovementWallet(): UseMovementWalletReturn {
  const { ready, authenticated, user, login, logout: privyLogout } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const { createWallet } = useCreateWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  // Find or create the Aptos wallet from linked accounts (works for Movement)
  useEffect(() => {
    const findOrCreateWallet = async () => {
      if (authenticated && user?.linkedAccounts) {
        // Find the Aptos wallet - Movement uses Aptos wallet type
        const aptosWallet = user.linkedAccounts.find(
          (account: any) => account.chainType === 'aptos'
        );

        if (aptosWallet) {
          setAddress((aptosWallet as any).address || null);
          setPublicKey((aptosWallet as any).publicKey || null);
        } else if (!isCreatingWallet) {
          // No Aptos wallet found, create one
          setIsCreatingWallet(true);
          try {
            console.log('Creating Aptos wallet for Movement...');
            const result = await createWallet({ chainType: 'aptos' });
            if (result?.wallet) {
              setAddress(result.wallet.address || null);
              setPublicKey((result.wallet as any).publicKey || null);
              console.log('Aptos wallet created:', result.wallet.address);
            }
          } catch (error) {
            console.error('Failed to create Aptos wallet:', error);
          } finally {
            setIsCreatingWallet(false);
          }
        }
      } else {
        setAddress(null);
        setPublicKey(null);
      }
    };

    findOrCreateWallet();
  }, [authenticated, user?.linkedAccounts, createWallet, isCreatingWallet]);

  // Logout
  const logout = useCallback(async () => {
    await privyLogout();
    setAddress(null);
    setPublicKey(null);
  }, [privyLogout]);

  // Sign and submit transaction to Movement
  const signAndSubmitTransaction = useCallback(
    async (payload: InputEntryFunctionData): Promise<TransactionResult> => {
      if (!address || !publicKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      setIsLoading(true);
      try {
        // Build the transaction
        const rawTxn = await aptos.transaction.build.simple({
          sender: address,
          data: {
            function: payload.function as `${string}::${string}::${string}`,
            typeArguments: (payload.typeArguments as string[]) || [],
            functionArguments: payload.functionArguments || [],
          },
        });

        // Generate signing message
        const signingMessage = generateSigningMessageForTransaction(rawTxn);

        // Sign using Privy's signRawHash with the Aptos wallet
        const signResult = await signRawHash({
          address,
          chainType: 'aptos',
          hash: `0x${toHex(signingMessage)}`,
        });

        if (!signResult || !signResult.signature) {
          throw new Error('Failed to sign transaction');
        }

        // Clean public key - remove 0x prefix and handle 33-byte keys
        let cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
        if (cleanPublicKey.length === 66) {
          // 33 bytes = 66 hex chars, strip first byte
          cleanPublicKey = cleanPublicKey.slice(2);
        }

        // Clean signature - remove 0x prefix if present
        const cleanSignature = signResult.signature.startsWith('0x')
          ? signResult.signature.slice(2)
          : signResult.signature;

        // Create authenticator
        const senderAuthenticator = new AccountAuthenticatorEd25519(
          new Ed25519PublicKey(cleanPublicKey),
          new Ed25519Signature(cleanSignature)
        );

        // Submit transaction
        const pendingTx = await aptos.transaction.submit.simple({
          transaction: rawTxn,
          senderAuthenticator,
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
    [address, publicKey, signRawHash]
  );

  // Sign message using signRawHash
  const signMessage = useCallback(
    async (message: string): Promise<{ signature: string } | null> => {
      if (!address) return null;

      try {
        // Convert message to hex
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(message);
        const messageHex = `0x${toHex(messageBytes)}` as `0x${string}`;

        const result = await signRawHash({
          address,
          chainType: 'aptos',
          hash: messageHex,
        });

        if (result?.signature) {
          return { signature: result.signature };
        }
        return null;
      } catch (error) {
        console.error('Sign message error:', error);
        return null;
      }
    },
    [address, signRawHash]
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
    isLoading: isLoading || isCreatingWallet,
    isConnected,
    address,
    publicKey,
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
