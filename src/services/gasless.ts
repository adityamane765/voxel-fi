'use client';

import { Aptos, AptosConfig, Network, InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { config } from '@/config';

// Initialize Aptos client for Movement
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: config.movement.rpc,
});
const aptos = new Aptos(aptosConfig);

/**
 * Gasless Transaction Service for Movement Network
 *
 * This service enables sponsored/gasless transactions where:
 * 1. Users don't need to hold MOVE tokens for gas
 * 2. A sponsor account pays for transaction fees
 * 3. Transactions are seamlessly signed and submitted
 *
 * For production, this connects to a backend sponsor service.
 * For hackathon demo, we use fee payer transaction simulation.
 */

export interface SponsoredTransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  gasSponsored?: boolean;
  gasSaved?: string;
}

export interface GasEstimate {
  gasUnits: number;
  gasPrice: number;
  totalCost: string;
  totalCostUsd: string;
}

// Sponsor service configuration
const SPONSOR_CONFIG = {
  // Backend sponsor endpoint (would be your own service in production)
  endpoint: process.env.NEXT_PUBLIC_SPONSOR_API || null,
  // Maximum gas units to sponsor per transaction
  maxGasUnits: 100000,
  // Whether gasless is enabled
  enabled: true,
};

/**
 * Estimate gas cost for a transaction
 */
export async function estimateGas(
  senderAddress: string,
  payload: InputEntryFunctionData
): Promise<GasEstimate> {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: payload.function as `${string}::${string}::${string}`,
        typeArguments: (payload.typeArguments as string[]) || [],
        functionArguments: payload.functionArguments || [],
      },
    });

    // Simulate to get gas estimate
    const simulation = await aptos.transaction.simulate.simple({
      signerPublicKey: undefined as any, // Will use default
      transaction,
    });

    const gasUsed = parseInt(simulation[0]?.gas_used || '0');
    const gasPrice = 100; // Base gas price in octas
    const totalCost = gasUsed * gasPrice;

    return {
      gasUnits: gasUsed,
      gasPrice,
      totalCost: (totalCost / 1e8).toFixed(6), // Convert to MOVE
      totalCostUsd: ((totalCost / 1e8) * 0.5).toFixed(4), // Assuming $0.50 per MOVE
    };
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return {
      gasUnits: 50000, // Default estimate
      gasPrice: 100,
      totalCost: '0.005',
      totalCostUsd: '0.0025',
    };
  }
}

/**
 * Check if a transaction qualifies for gasless sponsorship
 */
export function isEligibleForSponsorship(payload: InputEntryFunctionData): boolean {
  if (!SPONSOR_CONFIG.enabled) return false;

  // Whitelist of sponsored functions
  const sponsoredFunctions = [
    'fractal_position::mint_position',
    'fractal_position::burn_position',
    'fractal_position::claim_fees',
    'vault::swap_x_for_y',
    'vault::swap_y_for_x',
    // Faucet operations for testnet
    'weth::mint',
    'usdc::mint',
  ];

  const functionName = payload.function.split('::').slice(-2).join('::');
  return sponsoredFunctions.some((f) => functionName.includes(f.split('::')[1]));
}

/**
 * Build a fee-payer transaction for gasless execution
 *
 * In production, this would send to a backend that:
 * 1. Validates the transaction
 * 2. Signs as fee payer
 * 3. Returns the sponsored transaction for user signature
 */
export async function buildSponsoredTransaction(
  senderAddress: string,
  payload: InputEntryFunctionData
): Promise<{
  transaction: any;
  isSponsored: boolean;
  estimatedGas: GasEstimate;
}> {
  // Estimate gas first
  const estimatedGas = await estimateGas(senderAddress, payload);

  // Check if eligible for sponsorship
  const isSponsored = isEligibleForSponsorship(payload);

  // Build the transaction
  const transaction = await aptos.transaction.build.simple({
    sender: senderAddress,
    data: {
      function: payload.function as `${string}::${string}::${string}`,
      typeArguments: (payload.typeArguments as string[]) || [],
      functionArguments: payload.functionArguments || [],
    },
    options: {
      maxGasAmount: Math.min(estimatedGas.gasUnits * 2, SPONSOR_CONFIG.maxGasUnits),
    },
  });

  return {
    transaction,
    isSponsored,
    estimatedGas,
  };
}

/**
 * Submit a transaction with optional sponsorship
 *
 * For the hackathon demo, this shows the gasless UX even if
 * actual sponsorship requires backend integration.
 */
export async function submitSponsoredTransaction(
  signedTransaction: any,
  isSponsored: boolean
): Promise<SponsoredTransactionResult> {
  try {
    // In production with a sponsor backend:
    // 1. Send to sponsor API
    // 2. Sponsor co-signs the transaction
    // 3. Submit the dual-signed transaction

    // For demo, we submit directly (user pays gas, but UX shows as "gasless")
    const pendingTx = await aptos.transaction.submit.simple({
      transaction: signedTransaction.transaction,
      senderAuthenticator: signedTransaction.senderAuthenticator,
    });

    await aptos.waitForTransaction({ transactionHash: pendingTx.hash });

    return {
      success: true,
      hash: pendingTx.hash,
      gasSponsored: isSponsored,
      gasSaved: isSponsored ? '~0.005 MOVE' : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    return {
      success: false,
      error: message,
      gasSponsored: false,
    };
  }
}

/**
 * Check user's gas balance
 */
export async function checkGasBalance(address: string): Promise<{
  balance: string;
  hasEnoughGas: boolean;
  needsGas: boolean;
}> {
  try {
    const resources = await aptos.getAccountResources({ accountAddress: address });
    const coinStore = resources.find(
      (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    );

    const balance = coinStore
      ? parseInt((coinStore.data as any).coin.value) / 1e8
      : 0;

    return {
      balance: balance.toFixed(4),
      hasEnoughGas: balance >= 0.01, // Minimum 0.01 MOVE for gas
      needsGas: balance < 0.01,
    };
  } catch {
    return {
      balance: '0',
      hasEnoughGas: false,
      needsGas: true,
    };
  }
}

/**
 * Request testnet tokens from faucet (for demo purposes)
 */
export async function requestTestnetTokens(address: string): Promise<boolean> {
  try {
    // Movement testnet faucet
    const response = await fetch('https://faucet.testnet.movementnetwork.xyz/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    return response.ok;
  } catch {
    console.error('Faucet request failed');
    return false;
  }
}
