'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'voxelfi_positions';

export interface StoredPosition {
  tokenAddress: string;
  positionId: number;
  createdAt: number;
  pair: string;
  fractalType: string;
}

/**
 * Hook for persisting position NFT addresses in localStorage
 * Since positions are NFTs, we need to track which ones belong to the user
 */
export function usePositionStorage() {
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load positions from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPositions(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load positions from storage:', error);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save positions to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      } catch (error) {
        console.error('Failed to save positions to storage:', error);
      }
    }
  }, [positions, isLoaded]);

  const addPosition = useCallback((position: StoredPosition) => {
    setPositions((prev) => {
      // Avoid duplicates
      if (prev.some((p) => p.tokenAddress === position.tokenAddress)) {
        return prev;
      }
      return [...prev, position];
    });
  }, []);

  const removePosition = useCallback((tokenAddress: string) => {
    setPositions((prev) => prev.filter((p) => p.tokenAddress !== tokenAddress));
  }, []);

  const getPosition = useCallback(
    (tokenAddress: string) => {
      return positions.find((p) => p.tokenAddress === tokenAddress);
    },
    [positions]
  );

  const clearAllPositions = useCallback(() => {
    setPositions([]);
  }, []);

  return {
    positions,
    isLoaded,
    addPosition,
    removePosition,
    getPosition,
    clearAllPositions,
  };
}
