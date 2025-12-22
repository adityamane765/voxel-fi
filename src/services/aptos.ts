import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import type { InputViewFunctionData, InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { config, validateConfig } from '../config';

const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: config.movement.rpc,
});

export const aptos = new Aptos(aptosConfig);

function getModuleAddress(): string {
  const { missing } = validateConfig();
  if (!config.movement.moduleAddress) {
    console.warn('Module address not configured:', missing);
    throw new Error('Module address not configured. Please set VITE_MODULE_ADDRESS.');
  }
  return config.movement.moduleAddress;
}

function toBigIntSafe(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  return BigInt(0);
}

function toNumberSafe(value: unknown): number {
  const bigVal = toBigIntSafe(value);
  if (bigVal > BigInt(Number.MAX_SAFE_INTEGER)) {
    console.warn('Value exceeds MAX_SAFE_INTEGER, precision may be lost:', bigVal.toString());
  }
  return Number(bigVal);
}

export interface PositionParams {
  amountX: number;
  amountY: number;
  priceCenter: number;
  spread: number;
  fractalType: number;
  depth: number;
}

export interface Position {
  id: number;
  owner: string;
  liquidity: bigint;
  liquidityFormatted: number;
  priceCenter: number;
  spread: number;
  fractalType: number;
  depth: number;
}

export const fractalPositionService = {
  isConfigured(): boolean {
    return Boolean(config.movement.moduleAddress);
  },

  async getPosition(owner: string, positionId: number): Promise<Position> {
    const moduleAddress = getModuleAddress();
    const payload: InputViewFunctionData = {
      function: `${moduleAddress}::fractal_position::get_position`,
      functionArguments: [owner, positionId],
    };
    
    try {
      const result = await aptos.view({ payload });
      const liquidity = toBigIntSafe(result[2]);
      
      return {
        id: toNumberSafe(result[0]),
        owner: String(result[1]),
        liquidity,
        liquidityFormatted: toNumberSafe(liquidity),
        priceCenter: toNumberSafe(result[3]),
        spread: toNumberSafe(result[4]),
        fractalType: toNumberSafe(result[5]),
        depth: toNumberSafe(result[6]),
      };
    } catch (error) {
      console.error('Failed to fetch position:', error);
      throw new Error(`Failed to fetch position: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async getLiquidityAtPrice(owner: string, positionId: number, price: number): Promise<bigint> {
    const moduleAddress = getModuleAddress();
    const payload: InputViewFunctionData = {
      function: `${moduleAddress}::fractal_position::liquidity_at_price`,
      functionArguments: [owner, positionId, price],
    };
    
    try {
      const result = await aptos.view({ payload });
      return toBigIntSafe(result[0]);
    } catch (error) {
      console.error('Failed to fetch liquidity at price:', error);
      throw new Error(`Failed to fetch liquidity: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  buildMintPositionPayload(
    coinTypeX: string,
    coinTypeY: string,
    params: PositionParams
  ): InputEntryFunctionData {
    const moduleAddress = getModuleAddress();
    return {
      function: `${moduleAddress}::fractal_position::mint_position`,
      typeArguments: [coinTypeX, coinTypeY],
      functionArguments: [
        params.amountX,
        params.amountY,
        params.priceCenter,
        params.spread,
        params.fractalType,
        params.depth,
      ],
    };
  },

  buildBurnPositionPayload(
    coinTypeX: string,
    coinTypeY: string,
    positionId: number
  ): InputEntryFunctionData {
    const moduleAddress = getModuleAddress();
    return {
      function: `${moduleAddress}::fractal_position::burn_position`,
      typeArguments: [coinTypeX, coinTypeY],
      functionArguments: [positionId],
    };
  },
};

export interface VaultReserves {
  reserveX: bigint;
  reserveY: bigint;
  reserveXFormatted: number;
  reserveYFormatted: number;
}

export const vaultService = {
  isConfigured(): boolean {
    return Boolean(config.movement.moduleAddress);
  },

  async getReserves(adminAddr: string, coinTypeX: string, coinTypeY: string): Promise<VaultReserves> {
    const moduleAddress = getModuleAddress();
    const payload: InputViewFunctionData = {
      function: `${moduleAddress}::vault::get_reserves`,
      typeArguments: [coinTypeX, coinTypeY],
      functionArguments: [adminAddr],
    };
    
    try {
      const result = await aptos.view({ payload });
      const reserveX = toBigIntSafe(result[0]);
      const reserveY = toBigIntSafe(result[1]);
      
      return {
        reserveX,
        reserveY,
        reserveXFormatted: toNumberSafe(reserveX),
        reserveYFormatted: toNumberSafe(reserveY),
      };
    } catch (error) {
      console.error('Failed to fetch vault reserves:', error);
      throw new Error(`Failed to fetch vault reserves: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  buildInitVaultPayload(coinTypeX: string, coinTypeY: string): InputEntryFunctionData {
    const moduleAddress = getModuleAddress();
    return {
      function: `${moduleAddress}::vault::init`,
      typeArguments: [coinTypeX, coinTypeY],
      functionArguments: [],
    };
  },
};
