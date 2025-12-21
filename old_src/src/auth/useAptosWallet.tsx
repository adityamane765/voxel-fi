import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export function useAptosWallet() {
  const { authenticated, user } = usePrivy();
  
  // Use official Aptos Wallet Adapter
  const {
    connect,
    disconnect,
    account,
    connected,
    wallet,
    wallets,
    signAndSubmitTransaction: adapterSignAndSubmit,
  } = useWallet();

  const connectAptosWallet = async () => {
    try {
      // Connect to the first available wallet (usually Petra)
      if (wallets && wallets.length > 0) {
        await connect(wallets[0].name);
      } else {
        throw new Error("No Aptos wallets detected");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  const disconnectAptosWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  // Wrapper function that uses the adapter's signAndSubmitTransaction
  const signAndSubmitTransaction = async (transaction: InputTransactionData) => {
    if (!connected || !adapterSignAndSubmit) {
      throw new Error("Wallet not connected");
    }
    
    try {
      const response = await adapterSignAndSubmit(transaction);
      return response;
    } catch (error) {
      console.error("Transaction error:", error);
      throw error;
    }
  };

  return {
    // Privy auth state
    isAuthenticated: authenticated,
    privyUser: user,
    
    // Aptos wallet state
    aptosWallet: connected && account ? {
      address: account.address.toString(),
      publicKey: account.publicKey.toString(),
      signAndSubmitTransaction,
    } : null,
    isAptosConnected: connected,
    isAptosWalletAvailable: wallets && wallets.length > 0,
    walletName: wallet?.name || "Aptos Wallet",
    
    // Actions
    connectAptosWallet,
    disconnectAptosWallet,
    
    // Raw adapter access
    account,
    signAndSubmitTransaction,
  };
}