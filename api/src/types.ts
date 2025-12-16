export type FractalType =
  | 0 // BINARY
  | 1 // FIBONACCI
  | 2 // LINEAR
  | 3 // EXPONENTIAL
  | 4; // CANTOR

export interface FractalPosition {
  id: number;
  owner: string;
  totalLiquidity: number;
  priceCenter: number;
  spread: number;
  fractalType: FractalType;
  depth: number;
}

/* View Function Responses */

// vault::get_reserves
export interface VaultReserves {
  reserveX: number;
  reserveY: number;
}

// fractal_position::liquidity_at_price
export interface LiquidityView {
  liquidity: number;
}

// spatial_octree::query
export interface OctreeQueryResult {
  liquidity: number;
}

/* ZK Types */

export interface ZKCommitRequest {
  positionId: number;
  commitmentHash: string; // hex or base64
}

export interface ZKProofRequest {
  owner: string;
  positionId: number;
  proof: unknown;
}

export interface ZKProofResult {
  verified: boolean;
}

/* API DTOs */

export interface MintPositionRequest {
  amountX: number;
  amountY: number;
  priceCenter: number;
  spread: number;
  fractalType: FractalType;
  depth: number;
}

export interface BurnPositionRequest {
  positionId: number;
}
