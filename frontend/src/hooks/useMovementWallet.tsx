import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { MOVEMENT_CHAIN_ID } from '../config/privyConfig';

export function useMovementWallet() {
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets, ready } = useWallets();
  const [embeddedWallet, setEmbeddedWallet] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Find the embedded wallet
  useEffect(() => {
    if (ready && wallets.length > 0) {
      const embedded = wallets.find(wallet => wallet.walletClientType === 'privy');
      setEmbeddedWallet(embedded);
      
      if (embedded) {
        setAddress(embedded.address);
      }
    }
  }, [wallets, ready]);

  // Auto-switch to Movement chain
  const ensureMovementChain = async () => {
    if (!embeddedWallet) {
      throw new Error('Embedded wallet not initialized');
    }

    try {
      // Switch to Movement network
      await embeddedWallet.switchChain(MOVEMENT_CHAIN_ID);
      console.log('✅ Switched to Movement M1 Testnet');
    } catch (error: any) {
      // If chain not added, this will fail - that's expected
      console.log('Chain switch attempted:', error.message);
    }
  };

  // Connect wallet (create if needed)
  const connect = async () => {
    if (!authenticated) {
      setIsConnecting(true);
      try {
        await login();
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    if (embeddedWallet) {
      await ensureMovementChain();
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    await logout();
    setAddress(null);
    setEmbeddedWallet(null);
  };

  // Get provider for transaction signing
  const getProvider = async () => {
    if (!embeddedWallet) {
      throw new Error('Wallet not connected');
    }

    await ensureMovementChain();
    const provider = await embeddedWallet.getEthersProvider();
    return provider;
  };

  // Sign and submit transaction (seamless - no user prompts)
  const signAndSubmitTransaction = async (transaction: any) => {
    if (!embeddedWallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      await ensureMovementChain();
      const provider = await embeddedWallet.getEthersProvider();
      const signer = provider.getSigner();

      console.log('📤 Submitting transaction:', transaction);

      // For Aptos-style transactions, we need to format them properly
      const tx = await signer.sendTransaction(transaction);
      const receipt = await tx.wait();

      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  };

  // Export wallet (for users who want to manage it elsewhere)
  const exportWallet = async () => {
    if (!embeddedWallet) {
      throw new Error('Wallet not connected');
    }
    // Privy provides a UI for exporting
    return embeddedWallet;
  };

  return {
    // Auth state
    isAuthenticated: authenticated,
    user,
    
    // Wallet state
    address,
    isConnected: !!embeddedWallet && !!address,
    isReady: ready,
    isConnecting,
    embeddedWallet,
    
    // Actions
    connect,
    disconnect,
    login,
    logout,
    
    // Transaction signing
    signAndSubmitTransaction,
    getProvider,
    exportWallet,
    
    // Chain management
    ensureMovementChain,
  };
}