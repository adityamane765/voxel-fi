'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  querySpatialLiquidity,
  querySpatialLiquidityRange,
  priceToBucket,
  bucketToPrice,
  SpatialLiquidityPoint,
} from '@/services/aptos';

export interface SpatialPosition {
  priceBucket: number;
  volBucket: number;
  depthBucket: number;
  liquidity: number;
  // Computed 3D coordinates for visualization
  x: number;
  y: number;
  z: number;
}

export interface UseSpatialOctreeReturn {
  // State
  spatialData: SpatialPosition[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  refresh: () => Promise<void>;
  queryAtPoint: (priceBucket: number, volBucket: number, depthBucket: number) => Promise<number>;
  queryRange: (priceStart: number, priceEnd: number) => Promise<void>;

  // Utilities
  priceToBucket: (price: number) => number;
  bucketToPrice: (bucket: number) => number;
}

// Convert spatial point to 3D visualization coordinates
function spatialToCoords(point: SpatialLiquidityPoint): SpatialPosition {
  // Map buckets to 3D space
  // Price: 0-4095 -> -6 to 6 on X axis
  // Volatility: 0-3 -> -3 to 3 on Z axis
  // Depth: 0-3 -> -2 to 2 on Y axis
  const x = ((point.priceBucket / 4095) - 0.5) * 12;
  const y = (point.depthBucket - 1.5) * 2;
  const z = (point.volBucket - 1.5) * 3;

  return {
    ...point,
    x,
    y,
    z,
  };
}

/**
 * Hook for querying spatial octree data
 * Used for 3D visualization of liquidity distribution
 */
export function useSpatialOctree(): UseSpatialOctreeReturn {
  const [spatialData, setSpatialData] = useState<SpatialPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Query liquidity at a specific point
  const queryAtPoint = useCallback(
    async (priceBucket: number, volBucket: number, depthBucket: number): Promise<number> => {
      try {
        return await querySpatialLiquidity(priceBucket, volBucket, depthBucket);
      } catch (err) {
        console.error('Failed to query spatial point:', err);
        return 0;
      }
    },
    []
  );

  // Query liquidity across a price range
  const queryRange = useCallback(
    async (priceStart: number, priceEnd: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const points = await querySpatialLiquidityRange(
          priceStart,
          priceEnd,
          [0, 1, 2, 3],
          [0, 1, 2, 3]
        );

        const positions = points.map(spatialToCoords);
        setSpatialData(positions);
        setLastUpdated(new Date());
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to query spatial data';
        setError(errorMsg);
        console.error('Spatial octree error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Refresh all spatial data (query common price ranges)
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Query a range of price buckets that are likely to have liquidity
      // Focus on buckets that represent typical ETH prices ($1000 - $5000)
      const points: SpatialLiquidityPoint[] = [];

      // Sample across the full range to find where liquidity exists
      // Query in chunks to avoid too many parallel requests
      const sampleBuckets = [
        // Sample every 100 buckets to get a sense of distribution
        ...Array.from({ length: 41 }, (_, i) => i * 100),
      ];

      const queries = sampleBuckets.flatMap((priceBucket) =>
        [0, 1, 2, 3].flatMap((volBucket) =>
          [0, 1, 2, 3].map((depthBucket) =>
            querySpatialLiquidity(priceBucket, volBucket, depthBucket).then((liquidity) => {
              if (liquidity > 0) {
                points.push({ priceBucket, volBucket, depthBucket, liquidity });
              }
            })
          )
        )
      );

      await Promise.all(queries);

      const positions = points.map(spatialToCoords);
      setSpatialData(positions);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh spatial data';
      setError(errorMsg);
      console.error('Spatial octree refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    spatialData,
    isLoading,
    error,
    lastUpdated,
    refresh,
    queryAtPoint,
    queryRange,
    priceToBucket,
    bucketToPrice,
  };
}

// Re-export types
export type { SpatialLiquidityPoint };
