import { usePrivy } from "@privy-io/react-auth";
import { useAptosWallet } from "../auth/useAptosWallet";
import { mintPosition } from "../blockchain/aptos";
import { useState } from "react";

export function WalletConnect() {
  const { login, logout } = usePrivy();
  const {
    isAuthenticated,
    privyUser,
    aptosWallet,
    isAptosConnected,
    isAptosWalletAvailable,
    connectAptosWallet,
    disconnectAptosWallet,
  } = useAptosWallet();

  const [txStatus, setTxStatus] = useState<string>("");

  // Example: Mint a position
  const handleMintPosition = async () => {
    if (!aptosWallet) {
      alert("Please connect your Aptos wallet first");
      return;
    }

    try {
      setTxStatus("Submitting transaction...");
      const response = await mintPosition(aptosWallet.signAndSubmitTransaction, {
        amountX: 1000000, // 0.01 APT (assuming 8 decimals)
        amountY: 1000000,
        priceCenter: 100000000, // 1.0 in fixed point
        spread: 10000000, // 0.1 in fixed point
        fractalType: 0,
        depth: 3,
      });

      setTxStatus(`Transaction submitted: ${response.hash}`);
      console.log("Transaction response:", response);
    } catch (err) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("Transaction error:", err);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Wallet Connection</h2>

      {/* Step 1: Privy Authentication */}
      <div className="mb-6 p-4 bg-gray-700 rounded">
        <h3 className="text-lg font-semibold mb-2 text-white">
          1. Privy Authentication
        </h3>
        {!isAuthenticated ? (
          <button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Login with Privy
          </button>
        ) : (
          <div>
            <p className="text-green-400 mb-2">
              ✓ Authenticated as {privyUser?.email?.address || privyUser?.wallet?.address}
            </p>
            <button
              onClick={logout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Aptos Wallet Connection */}
      <div className="mb-6 p-4 bg-gray-700 rounded">
        <h3 className="text-lg font-semibold mb-2 text-white">
          2. Aptos Wallet Connection
        </h3>
        
        {!isAptosWalletAvailable ? (
          <div className="text-yellow-400">
            ⚠ Please install Petra or another Aptos wallet extension
          </div>
        ) : !isAptosConnected ? (
          <button
            onClick={connectAptosWallet}
            disabled={!isAuthenticated}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect Aptos Wallet
          </button>
        ) : (
          <div>
            <p className="text-green-400 mb-2">
              ✓ Connected: {aptosWallet?.address.slice(0, 6)}...
              {aptosWallet?.address.slice(-4)}
            </p>
            <button
              onClick={disconnectAptosWallet}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Disconnect Aptos Wallet
            </button>
          </div>
        )}
      </div>

      {/* Step 3: Interact with Blockchain */}
      <div className="p-4 bg-gray-700 rounded">
        <h3 className="text-lg font-semibold mb-2 text-white">
          3. Blockchain Interaction
        </h3>
        
        <button
          onClick={handleMintPosition}
          disabled={!isAptosConnected}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed mb-2"
        >
          Mint Test Position
        </button>
        
        {txStatus && (
          <p className="text-sm text-gray-300 mt-2 break-all">{txStatus}</p>
        )}
      </div>
    </div>
  );
}