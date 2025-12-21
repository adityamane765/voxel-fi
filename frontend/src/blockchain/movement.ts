import { AptosClient } from 'aptos';
import { MOVEMENT_RPC_URL } from '../config/privyConfig';

const MODULE = "0x43f0581028053bb1b1a738c34637203ff015fac6683592ef781722d8e40449e3";
const COIN = "0x1::aptos_coin::AptosCoin";

// Initialize Aptos client for Movement
const client = new AptosClient(MOVEMENT_RPC_URL);

/**
 * Build raw transaction payload for Movement/Aptos
 */
function buildTransactionPayload(
  functionName: string,
  typeArgs: string[],
  args: any[]
) {
  return {
    type: 'entry_function_payload',
    function: functionName,
    type_arguments: typeArgs,
    arguments: args,
  };
}

/**
 * Mint a fractal position using Privy embedded wallet
 */
export async function mintPosition(
  signAndSubmitTransaction: (transaction: any) => Promise<any>,
  address: string,
  params: {
    amountX: number;
    amountY: number;
    priceCenter: number;
    spread: number;
    fractalType: number;
    depth: number;
  }
) {
  try {
    const payload = buildTransactionPayload(
      `${MODULE}::fractal_position::mint_position`,
      [COIN, COIN],
      [
        params.amountX.toString(),
        params.amountY.toString(),
        params.priceCenter.toString(),
        params.spread.toString(),
        params.fractalType.toString(),
        params.depth.toString(),
      ]
    );

    console.log('📤 Building mint transaction:', payload);

    // Generate transaction using Movement client
    const rawTxn = await client.generateTransaction(address, payload, {
      max_gas_amount: '100000',
      gas_unit_price: '100',
    });

    // Sign and submit through Privy
    const pendingTxn = await signAndSubmitTransaction({
      to: MODULE,
      data: JSON.stringify(rawTxn),
      value: '0',
    });

    console.log('✅ Transaction submitted:', pendingTxn);

    // Wait for confirmation
    const txResult = await waitForTransaction(pendingTxn.hash);
    console.log('✅ Transaction confirmed:', txResult);

    return txResult;
  } catch (error) {
    console.error('❌ Error minting position:', error);
    throw error;
  }
}

/**
 * Burn a position using Privy embedded wallet
 */
export async function burnPosition(
  signAndSubmitTransaction: (transaction: any) => Promise<any>,
  address: string,
  positionId: number
) {
  try {
    const payload = buildTransactionPayload(
      `${MODULE}::fractal_position::burn_position`,
      [COIN, COIN],
      [positionId.toString()]
    );

    console.log('📤 Building burn transaction:', payload);

    const rawTxn = await client.generateTransaction(address, payload, {
      max_gas_amount: '100000',
      gas_unit_price: '100',
    });

    const pendingTxn = await signAndSubmitTransaction({
      to: MODULE,
      data: JSON.stringify(rawTxn),
      value: '0',
    });

    console.log('✅ Transaction submitted:', pendingTxn);

    const txResult = await waitForTransaction(pendingTxn.hash);
    console.log('✅ Transaction confirmed:', txResult);

    return txResult;
  } catch (error) {
    console.error('❌ Error burning position:', error);
    throw error;
  }
}

/**
 * Get transaction status from Movement fullnode
 */
export async function getTransactionStatus(txHash: string): Promise<any> {
  const response = await fetch(
    `${MOVEMENT_RPC_URL}/transactions/by_hash/${txHash}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch transaction status');
  }
  
  return response.json();
}

/**
 * Wait for transaction confirmation
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
  
  throw new Error('Transaction confirmation timeout');
}

/**
 * Get account balance on Movement
 */
export async function getAccountBalance(address: string): Promise<string> {
  try {
    const resource = await client.getAccountResource(
      address,
      '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    );
    
    return (resource.data as any).coin.value;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

/**
 * Get account resources (for debugging)
 */
export async function getAccountResources(address: string) {
  try {
    return await client.getAccountResources(address);
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
}