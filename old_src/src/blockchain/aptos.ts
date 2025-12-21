import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

const MODULE ="0x43f0581028053bb1b1a738c34637203ff015fac6683592ef781722d8e40449e3";
const COIN = "0x1::aptos_coin::AptosCoin";

/**
 * Mint a fractal position using official Aptos Wallet Adapter
 */
export async function mintPosition(
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<any>,
  params: {
    amountX: number;
    amountY: number;
    priceCenter: number;
    spread: number;
    fractalType: number;
    depth: number;
  }
) {
  const transaction: InputTransactionData = {
    data: {
      function: `${MODULE}::fractal_position::mint_position`,
      typeArguments: [COIN, COIN],
      functionArguments: [
        params.amountX,
        params.amountY,
        params.priceCenter,
        params.spread,
        params.fractalType,
        params.depth,
      ],
    },
  };

  try {
    console.log("📤 Submitting mint transaction:", transaction);
    const response = await signAndSubmitTransaction(transaction);
    console.log("✅ Transaction response:", response);
    return response;
  } catch (error) {
    console.error("❌ Error minting position:", error);
    throw error;
  }
}

/**
 * Burn a position using official Aptos Wallet Adapter
 */
export async function burnPosition(
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<any>,
  positionId: number
) {
  const transaction: InputTransactionData = {
    data: {
      function: `${MODULE}::fractal_position::burn_position`,
      typeArguments: [COIN, COIN],
      functionArguments: [positionId],
    },
  };

  try {
    console.log("📤 Submitting burn transaction:", transaction);
    const response = await signAndSubmitTransaction(transaction);
    console.log("✅ Transaction response:", response);
    return response;
  } catch (error) {
    console.error("❌ Error burning position:", error);
    throw error;
  }
}

/**
 * Get transaction status from Aptos fullnode
 */
export async function getTransactionStatus(txHash: string): Promise<any> {
  const response = await fetch(
    `https://fullnode.mainnet.aptoslabs.com/v1/transactions/by_hash/${txHash}`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch transaction status");
  }
  
  return response.json();
}

/**
 * Wait for transaction to be confirmed on-chain
 */
export async function waitForTransaction(
  txHash: string,
  timeoutMs: number = 30000
): Promise<any> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const tx = await getTransactionStatus(txHash);
      if (tx.success !== undefined) {
        return tx;
      }
    } catch (error) {
      // Transaction not yet available, continue polling
    }
    
    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error("Transaction confirmation timeout");
}

/**
 * Get account balance
 */
export async function getAccountBalance(address: string): Promise<string> {
  try {
    const response = await fetch(
      `https://testnet.movementnetwork.xyz/v1/accounts/${address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch balance");
    }
    
    const data = await response.json();
    return data.data.coin.value;
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
}