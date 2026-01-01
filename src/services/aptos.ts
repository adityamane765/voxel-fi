import {
  Aptos,
  AptosConfig,
  Network,
  InputViewFunctionData,
  InputEntryFunctionData,
} from '@aptos-labs/ts-sdk';
import { config } from '@/config';

// Initialize Aptos client for Movement Network
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: config.movement.rpc,
});

export const aptos = new Aptos(aptosConfig);

// Type definitions
export interface PositionData {
  id: number;
  owner: string;
  token_name: string;
  amount_x: number;
  amount_y: number;
  total_liquidity: number;
  price_center: number;
  spread: number;
  fractal_type: number;
  depth: number;
  volatility_bucket: number;
  unclaimed_fees_x: number;
  unclaimed_fees_y: number;
  total_fees_earned_x: number;
  total_fees_earned_y: number;
}

export interface SwapQuote {
  amountOut: number;
  priceImpact: number;
  fee: number;
  minimumReceived: number;
}

// ==================== VIEW FUNCTIONS ====================

/**
 * Get WETH balance for an address
 */
export async function getWethBalance(address: string): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::weth::balance`,
      functionArguments: [address],
    };
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    // Account might not have registered the coin store yet
    console.log('Failed to get WETH balance:', error);
    return 0;
  }
}

/**
 * Get USDC balance for an address
 */
export async function getUsdcBalance(address: string): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::usdc::balance`,
      functionArguments: [address],
    };
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    // Account might not have registered the coin store yet
    console.log('Failed to get USDC balance:', error);
    return 0;
  }
}

/**
 * Get both token balances for an address
 */
export async function getTokenBalances(address: string): Promise<{ weth: number; usdc: number }> {
  const [weth, usdc] = await Promise.all([
    getWethBalance(address),
    getUsdcBalance(address),
  ]);
  return { weth, usdc };
}

/**
 * Get position data by NFT token address
 */
export async function getPositionData(tokenAddr: string): Promise<PositionData | null> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::fractal_position::get_position_data`,
      functionArguments: [tokenAddr],
    };
    const result = await aptos.view({ payload });

    // Parse the returned struct
    const data = result[0] as Record<string, unknown>;
    return {
      id: Number(data.id),
      owner: String(data.owner),
      token_name: String(data.token_name),
      amount_x: Number(data.amount_x),
      amount_y: Number(data.amount_y),
      total_liquidity: Number(data.total_liquidity),
      price_center: Number(data.price_center),
      spread: Number(data.spread),
      fractal_type: Number(data.fractal_type),
      depth: Number(data.depth),
      volatility_bucket: Number(data.volatility_bucket),
      unclaimed_fees_x: Number(data.unclaimed_fees_x),
      unclaimed_fees_y: Number(data.unclaimed_fees_y),
      total_fees_earned_x: Number(data.total_fees_earned_x),
      total_fees_earned_y: Number(data.total_fees_earned_y),
    };
  } catch (error) {
    console.error('Failed to get position data:', error);
    return null;
  }
}

/**
 * Get unclaimed fees for a position
 */
export async function getUnclaimedFees(
  tokenAddr: string,
  currentMarketPrice: number
): Promise<{ feesX: number; feesY: number }> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::fractal_position::get_unclaimed_fees`,
      functionArguments: [tokenAddr, currentMarketPrice.toString()],
    };
    const result = await aptos.view({ payload });
    return {
      feesX: Number(result[0]),
      feesY: Number(result[1]),
    };
  } catch (error) {
    console.error('Failed to get unclaimed fees:', error);
    return { feesX: 0, feesY: 0 };
  }
}

/**
 * Get vault reserves
 */
export async function getReserves(): Promise<{ reserveX: number; reserveY: number }> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::vault::get_reserves`,
      typeArguments: [config.tokens.weth, config.tokens.usdc],
    };
    const result = await aptos.view({ payload });
    return {
      reserveX: Number(result[0]),
      reserveY: Number(result[1]),
    };
  } catch (error) {
    console.error('Failed to get reserves:', error);
    return { reserveX: 0, reserveY: 0 };
  }
}

/**
 * Calculate swap output amount
 */
export async function calculateSwapOutput(amountIn: number): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::vault::calculate_swap_output`,
      typeArguments: [config.tokens.weth, config.tokens.usdc],
      functionArguments: [amountIn.toString()],
    };
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Failed to calculate swap output:', error);
    return 0;
  }
}

/**
 * Get pending fees in vault
 */
export async function getPendingFees(): Promise<{ feesX: number; feesY: number }> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::vault::get_pending_fees`,
      typeArguments: [config.tokens.weth, config.tokens.usdc],
    };
    const result = await aptos.view({ payload });
    return {
      feesX: Number(result[0]),
      feesY: Number(result[1]),
    };
  } catch (error) {
    console.error('Failed to get pending fees:', error);
    return { feesX: 0, feesY: 0 };
  }
}

/**
 * Get global fee statistics
 */
export async function getGlobalFeeStats(): Promise<{
  totalFeesCollectedX: number;
  totalFeesCollectedY: number;
  protocolFeesX: number;
  protocolFeesY: number;
}> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::fractal_position::get_global_fee_stats`,
    };
    const result = await aptos.view({ payload });
    return {
      totalFeesCollectedX: Number(result[0]),
      totalFeesCollectedY: Number(result[1]),
      protocolFeesX: Number(result[2]),
      protocolFeesY: Number(result[3]),
    };
  } catch (error) {
    console.error('Failed to get global fee stats:', error);
    return {
      totalFeesCollectedX: 0,
      totalFeesCollectedY: 0,
      protocolFeesX: 0,
      protocolFeesY: 0,
    };
  }
}

/**
 * Get liquidity at a specific price for a position
 */
export async function getLiquidityAtPrice(tokenAddr: string, price: number): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::fractal_position::liquidity_at_price`,
      functionArguments: [tokenAddr, price.toString()],
    };
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Failed to get liquidity at price:', error);
    return 0;
  }
}

// ==================== TRANSACTION PAYLOADS ====================

/**
 * Build register WETH coin store transaction payload
 */
export function buildRegisterWethPayload(): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::weth::register`,
    typeArguments: [],
    functionArguments: [],
  };
}

/**
 * Build register USDC coin store transaction payload
 */
export function buildRegisterUsdcPayload(): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::usdc::register`,
    typeArguments: [],
    functionArguments: [],
  };
}

/**
 * Build faucet WETH transaction payload (mint test tokens)
 */
export function buildFaucetWethPayload(amount: number): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::weth::faucet`,
    typeArguments: [],
    functionArguments: [amount.toString()],
  };
}

/**
 * Build faucet USDC transaction payload (mint test tokens)
 */
export function buildFaucetUsdcPayload(amount: number): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::usdc::faucet`,
    typeArguments: [],
    functionArguments: [amount.toString()],
  };
}

/**
 * Build mint position transaction payload
 */
export function buildMintPositionPayload(
  amountX: number,
  amountY: number,
  priceCenter: number,
  spread: number,
  fractalType: number,
  depth: number
): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::fractal_position::mint_position`,
    typeArguments: [config.tokens.weth, config.tokens.usdc],
    functionArguments: [
      amountX.toString(),
      amountY.toString(),
      priceCenter.toString(),
      spread.toString(),
      fractalType.toString(),
      depth.toString(),
    ],
  };
}

/**
 * Build burn position transaction payload
 */
export function buildBurnPositionPayload(
  positionObjectAddr: string,
  currentMarketPrice: number
): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::fractal_position::burn_position`,
    typeArguments: [config.tokens.weth, config.tokens.usdc],
    functionArguments: [positionObjectAddr, currentMarketPrice.toString()],
  };
}

/**
 * Build claim fees transaction payload
 */
export function buildClaimFeesPayload(
  positionObjectAddr: string,
  currentMarketPrice: number
): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::fractal_position::claim_fees`,
    typeArguments: [config.tokens.weth, config.tokens.usdc],
    functionArguments: [positionObjectAddr, currentMarketPrice.toString()],
  };
}

/**
 * Build swap X for Y transaction payload
 */
export function buildSwapPayload(
  amountIn: number,
  minAmountOut: number
): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::vault::swap`,
    typeArguments: [config.tokens.weth, config.tokens.usdc],
    functionArguments: [amountIn.toString(), minAmountOut.toString()],
  };
}

/**
 * Build swap Y for X transaction payload
 */
export function buildSwapYForXPayload(
  amountIn: number,
  minAmountOut: number
): InputEntryFunctionData {
  return {
    function: `${config.moduleAddress}::vault::swap_y_for_x`,
    typeArguments: [config.tokens.weth, config.tokens.usdc],
    functionArguments: [amountIn.toString(), minAmountOut.toString()],
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate swap quote with price impact and fees
 */
export async function getSwapQuote(
  amountIn: number,
  slippageBps: number = 50 // 0.5% default slippage
): Promise<SwapQuote> {
  const reserves = await getReserves();
  const amountOut = await calculateSwapOutput(amountIn);

  // Calculate price impact
  const spotPrice = reserves.reserveY / reserves.reserveX;
  const executionPrice = amountOut / amountIn;
  const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;

  // Calculate fee (0.3%)
  const fee = amountIn * 0.003;

  // Calculate minimum received with slippage
  const minimumReceived = amountOut * (1 - slippageBps / 10000);

  return {
    amountOut,
    priceImpact: Math.abs(priceImpact),
    fee,
    minimumReceived,
  };
}

/**
 * Get current market price from reserves
 */
export async function getCurrentMarketPrice(): Promise<number> {
  const reserves = await getReserves();
  if (reserves.reserveX === 0) return 0;
  // Price in terms of Y per X (e.g., USDC per WETH)
  // Scale to 6 decimals for precision
  return Math.floor((reserves.reserveY * 1000000) / reserves.reserveX);
}

/**
 * Parse transaction events to extract NFT token address from mint
 */
export function parsePositionMintedEvent(events: unknown[]): string | null {
  for (const event of events) {
    const e = event as Record<string, unknown>;
    if (typeof e.type === 'string' && e.type.includes('PositionMinted')) {
      const data = e.data as Record<string, unknown>;
      return String(data.token_addr);
    }
  }
  return null;
}

// ==================== SPATIAL OCTREE FUNCTIONS ====================

/**
 * Query liquidity at a specific spatial point in the octree
 * @param priceBucket - Price bucket (0-4095, 12-bit)
 * @param volBucket - Volatility bucket (0-3, 2-bit)
 * @param depthBucket - Fractal depth bucket (0-3, 2-bit)
 */
export async function querySpatialLiquidity(
  priceBucket: number,
  volBucket: number,
  depthBucket: number
): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::spatial_octree::query`,
      functionArguments: [
        priceBucket.toString(),
        volBucket.toString(),
        depthBucket.toString(),
      ],
    };
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Failed to query spatial liquidity:', error);
    return 0;
  }
}

/**
 * Query liquidity across a range of spatial coordinates
 * Useful for building 3D visualizations
 */
export async function querySpatialLiquidityRange(
  priceBucketStart: number,
  priceBucketEnd: number,
  volBuckets: number[] = [0, 1, 2, 3],
  depthBuckets: number[] = [0, 1, 2, 3]
): Promise<SpatialLiquidityPoint[]> {
  const points: SpatialLiquidityPoint[] = [];
  const queries: Promise<void>[] = [];

  // Batch queries for efficiency
  for (let price = priceBucketStart; price <= priceBucketEnd; price++) {
    for (const vol of volBuckets) {
      for (const depth of depthBuckets) {
        queries.push(
          querySpatialLiquidity(price, vol, depth).then((liquidity) => {
            if (liquidity > 0) {
              points.push({
                priceBucket: price,
                volBucket: vol,
                depthBucket: depth,
                liquidity,
              });
            }
          })
        );
      }
    }
  }

  await Promise.all(queries);
  return points.sort((a, b) => b.liquidity - a.liquidity);
}

export interface SpatialLiquidityPoint {
  priceBucket: number;
  volBucket: number;
  depthBucket: number;
  liquidity: number;
}

/**
 * Convert price to bucket (0-4095)
 * Assumes price is scaled to 6 decimals
 */
export function priceToBucket(price: number): number {
  // Map price range to 0-4095
  // Assuming typical price range of 0-10000 USDC
  const normalized = Math.floor((price / 10000000000) * 4095);
  return Math.min(4095, Math.max(0, normalized));
}

/**
 * Convert bucket back to approximate price
 */
export function bucketToPrice(bucket: number): number {
  return Math.floor((bucket / 4095) * 10000000000);
}

// ==================== VOLATILITY ORACLE FUNCTIONS ====================

export interface VolatilityMetrics {
  realizedVolatility: number;
  volatilityBucket: number;
  lastPrice: number;
  twap1h: number;
  twap24h: number;
  priceChange24h: number;
  lastUpdate: number;
}

export interface PriceSample {
  price: number;
  timestamp: number;
  volume: number;
}

/**
 * Get current volatility metrics from the oracle
 */
export async function getVolatilityMetrics(): Promise<VolatilityMetrics | null> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::volatility_oracle::get_volatility_metrics`,
      typeArguments: [config.tokens.weth, config.tokens.usdc],
    };
    const result = await aptos.view({ payload });

    const data = result[0] as Record<string, unknown>;
    return {
      realizedVolatility: Number(data.realized_volatility),
      volatilityBucket: Number(data.volatility_bucket),
      lastPrice: Number(data.last_price),
      twap1h: Number(data.twap_1h),
      twap24h: Number(data.twap_24h),
      priceChange24h: Number(data.price_change_24h),
      lastUpdate: Number(data.last_update),
    };
  } catch (error) {
    console.error('Failed to get volatility metrics:', error);
    return null;
  }
}

/**
 * Get current volatility bucket (0-3)
 * 0: Low (0-1% daily)
 * 1: Medium (1-3% daily)
 * 2: High (3-5% daily)
 * 3: Extreme (>5% daily)
 */
export async function getCurrentVolatilityBucket(): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::volatility_oracle::get_current_volatility_bucket`,
      typeArguments: [config.tokens.weth, config.tokens.usdc],
    };
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Failed to get volatility bucket:', error);
    return 0;
  }
}

/**
 * Get historical price data from the oracle
 * @param count - Number of samples to retrieve (max 288 = 24 hours at 5 min intervals)
 */
export async function getPriceHistory(count: number = 50): Promise<PriceSample[]> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::volatility_oracle::get_price_history`,
      typeArguments: [config.tokens.weth, config.tokens.usdc],
      functionArguments: [count.toString()],
    };
    const result = await aptos.view({ payload });

    const samples = result[0] as Array<Record<string, unknown>>;
    return samples.map((sample) => ({
      price: Number(sample.price),
      timestamp: Number(sample.timestamp),
      volume: Number(sample.volume),
    }));
  } catch (error) {
    console.error('Failed to get price history:', error);
    return [];
  }
}

/**
 * Calculate recommended spread based on current volatility
 * @param baseSpread - Base spread in scaled units (e.g., 500000000 for $500)
 */
export async function getRecommendedSpread(baseSpread: number): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${config.moduleAddress}::volatility_oracle::calculate_recommended_spread`,
      typeArguments: [config.tokens.weth, config.tokens.usdc],
      functionArguments: [baseSpread.toString()],
    };
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Failed to get recommended spread:', error);
    return baseSpread;
  }
}

/**
 * Get volatility bucket label
 */
export function getVolatilityBucketLabel(bucket: number): string {
  const labels = ['Low', 'Medium', 'High', 'Extreme'];
  return labels[bucket] || 'Unknown';
}

/**
 * Get volatility bucket description
 */
export function getVolatilityBucketDescription(bucket: number): string {
  const descriptions = [
    '0-1% daily volatility - Stable market conditions',
    '1-3% daily volatility - Normal market conditions',
    '3-5% daily volatility - Elevated volatility',
    '>5% daily volatility - High risk environment',
  ];
  return descriptions[bucket] || 'Unknown volatility level';
}
