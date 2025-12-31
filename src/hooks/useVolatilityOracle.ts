'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getVolatilityMetrics,
  getCurrentVolatilityBucket,
  getPriceHistory,
  getRecommendedSpread,
  getVolatilityBucketLabel,
  getVolatilityBucketDescription,
  VolatilityMetrics,
  PriceSample,
} from '@/services/aptos';

export interface UseVolatilityOracleReturn {
  // State
  metrics: VolatilityMetrics | null;
  volatilityBucket: number;
  priceHistory: PriceSample[];
  isLoading: boolean;
  error: string | null;

  // Computed values
  volatilityLabel: string;
  volatilityDescription: string;
  twap1hFormatted: string;
  twap24hFormatted: string;
  priceChange24hFormatted: string;

  // Actions
  refresh: () => Promise<void>;
  getRecommendedSpreadForBase: (baseSpread: number) => Promise<number>;

  // Spread recommendation
  spreadMultiplier: number;
  spreadRecommendation: string;
}

/**
 * Hook for accessing volatility oracle data
 * Provides real-time volatility metrics and spread recommendations
 */
export function useVolatilityOracle(): UseVolatilityOracleReturn {
  const [metrics, setMetrics] = useState<VolatilityMetrics | null>(null);
  const [volatilityBucket, setVolatilityBucket] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<PriceSample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all volatility data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [metricsData, bucket, history] = await Promise.all([
        getVolatilityMetrics(),
        getCurrentVolatilityBucket(),
        getPriceHistory(50),
      ]);

      setMetrics(metricsData);
      setVolatilityBucket(bucket);
      setPriceHistory(history);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch volatility data';
      setError(errorMsg);
      console.error('Volatility oracle error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Get recommended spread for a base value
  const getRecommendedSpreadForBase = useCallback(async (baseSpread: number): Promise<number> => {
    try {
      return await getRecommendedSpread(baseSpread);
    } catch {
      // Fallback: apply multiplier locally
      const multipliers = [1, 1.5, 2, 3];
      return baseSpread * multipliers[volatilityBucket];
    }
  }, [volatilityBucket]);

  // Computed values
  const volatilityLabel = getVolatilityBucketLabel(volatilityBucket);
  const volatilityDescription = getVolatilityBucketDescription(volatilityBucket);

  // Format TWAP values (convert from 6 decimal scaled)
  const formatPrice = (price: number): string => {
    if (price === 0) return '$0.00';
    const displayPrice = price / 1000000;
    return `$${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const twap1hFormatted = metrics ? formatPrice(metrics.twap1h) : '--';
  const twap24hFormatted = metrics ? formatPrice(metrics.twap24h) : '--';

  // Format 24h price change (in basis points)
  const priceChange24hFormatted = metrics
    ? `${(metrics.priceChange24h / 100).toFixed(2)}%`
    : '--';

  // Spread multiplier based on volatility
  const spreadMultipliers = [1, 1.5, 2, 3];
  const spreadMultiplier = spreadMultipliers[volatilityBucket] || 1;

  // Human-readable spread recommendation
  const spreadRecommendations = [
    'Use base spread - market is stable',
    'Consider 1.5x spread - moderate volatility',
    'Recommend 2x spread - elevated volatility',
    'Strongly recommend 3x spread - extreme volatility',
  ];
  const spreadRecommendation = spreadRecommendations[volatilityBucket] || 'Unable to determine';

  return {
    metrics,
    volatilityBucket,
    priceHistory,
    isLoading,
    error,
    volatilityLabel,
    volatilityDescription,
    twap1hFormatted,
    twap24hFormatted,
    priceChange24hFormatted,
    refresh,
    getRecommendedSpreadForBase,
    spreadMultiplier,
    spreadRecommendation,
  };
}

// Re-export types
export type { VolatilityMetrics, PriceSample };
