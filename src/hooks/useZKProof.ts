'use client';

import { useState, useCallback } from 'react';
import {
  generateOwnershipProof as generateOwnershipProofService,
  generateRangeProof as generateRangeProofService,
  verifyOwnershipProof,
  verifyRangeProof,
  generateCommitment,
  generateSecret,
  poseidonHash,
  SecretStorage,
  Groth16Proof,
  ZKProofResult,
  exportProof,
} from '@/services/zkProof';

export interface UseZKProofReturn {
  // State
  isGenerating: boolean;
  error: string | null;

  // Ownership Proof
  generateOwnershipProof: (tokenAddress: string) => Promise<OwnershipProofResult>;
  verifyOwnership: (proof: Groth16Proof, publicSignals: string[]) => Promise<boolean>;

  // Range Proof
  generateRangeProof: (value: number, min: number, max: number) => Promise<RangeProofResult>;
  verifyRange: (proof: Groth16Proof, publicSignals: string[]) => Promise<boolean>;

  // Utilities
  generatePositionSecret: () => string;
  generatePositionCommitment: (secret: string) => Promise<string>;
  storePositionSecret: (tokenAddress: string, secret: string) => void;
  hasStoredSecret: (tokenAddress: string) => boolean;
  getStoredSecretAddresses: () => string[];
}

export interface OwnershipProofResult {
  success: boolean;
  verified: boolean;
  proof: Groth16Proof | null;
  publicSignals: string[];
  commitment: string | null;
  error?: string;
  proofJson?: string;
}

export interface RangeProofResult {
  success: boolean;
  verified: boolean;
  proof: Groth16Proof | null;
  publicSignals: string[];
  min: number;
  max: number;
  error?: string;
  proofJson?: string;
}

/**
 * React Hook for ZK Proof Generation
 *
 * Provides a clean interface for generating and verifying ZK proofs
 * for ownership and range assertions.
 */
export function useZKProof(): UseZKProofReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate an ownership proof for a position
   *
   * @param tokenAddress - The NFT token address of the position
   * @returns Ownership proof result
   */
  const generateOwnershipProof = useCallback(
    async (tokenAddress: string): Promise<OwnershipProofResult> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Get stored secret for this position
        const secret = SecretStorage.getSecret(tokenAddress);

        if (!secret) {
          const errorMsg = 'No secret found for this position. You can only prove ownership for positions created on this device.';
          setError(errorMsg);
          return {
            success: false,
            verified: false,
            proof: null,
            publicSignals: [],
            commitment: null,
            error: errorMsg,
          };
        }

        // Generate the proof
        const result = await generateOwnershipProofService(secret);

        if (!result.success) {
          setError(result.error || 'Failed to generate proof');
          return {
            success: false,
            verified: false,
            proof: null,
            publicSignals: [],
            commitment: null,
            error: result.error,
          };
        }

        // Get commitment for display
        const commitment = await generateCommitment(secret);

        return {
          success: true,
          verified: result.verified,
          proof: result.proof,
          publicSignals: result.publicSignals,
          commitment,
          proofJson: result.proof ? exportProof(result.proof, result.publicSignals) : undefined,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate ownership proof';
        setError(errorMsg);
        return {
          success: false,
          verified: false,
          proof: null,
          publicSignals: [],
          commitment: null,
          error: errorMsg,
        };
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Verify an ownership proof
   */
  const verifyOwnership = useCallback(
    async (proof: Groth16Proof, publicSignals: string[]): Promise<boolean> => {
      try {
        return await verifyOwnershipProof(proof, publicSignals);
      } catch {
        return false;
      }
    },
    []
  );

  /**
   * Generate a range proof
   *
   * Proves a value lies within [min, max] without revealing the exact value.
   *
   * @param value - The actual value (kept private)
   * @param min - Minimum of the range (public)
   * @param max - Maximum of the range (public)
   */
  const generateRangeProof = useCallback(
    async (value: number, min: number, max: number): Promise<RangeProofResult> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Validate inputs
        if (value < min || value > max) {
          const errorMsg = `Value must be between ${min} and ${max}`;
          setError(errorMsg);
          return {
            success: false,
            verified: false,
            proof: null,
            publicSignals: [],
            min,
            max,
            error: errorMsg,
          };
        }

        // Generate the proof
        const result = await generateRangeProofService(value, min, max);

        if (!result.success) {
          setError(result.error || 'Failed to generate proof');
          return {
            success: false,
            verified: false,
            proof: null,
            publicSignals: [],
            min,
            max,
            error: result.error,
          };
        }

        return {
          success: true,
          verified: result.verified,
          proof: result.proof,
          publicSignals: result.publicSignals,
          min,
          max,
          proofJson: result.proof ? exportProof(result.proof, result.publicSignals) : undefined,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate range proof';
        setError(errorMsg);
        return {
          success: false,
          verified: false,
          proof: null,
          publicSignals: [],
          min,
          max,
          error: errorMsg,
        };
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Verify a range proof
   */
  const verifyRange = useCallback(
    async (proof: Groth16Proof, publicSignals: string[]): Promise<boolean> => {
      try {
        return await verifyRangeProof(proof, publicSignals);
      } catch {
        return false;
      }
    },
    []
  );

  /**
   * Generate a new secret for position creation
   */
  const generatePositionSecret = useCallback((): string => {
    return generateSecret();
  }, []);

  /**
   * Generate commitment hash from a secret
   */
  const generatePositionCommitment = useCallback(
    async (secret: string): Promise<string> => {
      return generateCommitment(secret);
    },
    []
  );

  /**
   * Store a secret for a position
   */
  const storePositionSecret = useCallback(
    (tokenAddress: string, secret: string): void => {
      SecretStorage.storeSecret(tokenAddress, secret);
    },
    []
  );

  /**
   * Check if we have a stored secret for a position
   */
  const hasStoredSecret = useCallback(
    (tokenAddress: string): boolean => {
      return SecretStorage.hasSecret(tokenAddress);
    },
    []
  );

  /**
   * Get all token addresses with stored secrets
   */
  const getStoredSecretAddresses = useCallback((): string[] => {
    return SecretStorage.getAllTokenAddresses();
  }, []);

  return {
    isGenerating,
    error,
    generateOwnershipProof,
    verifyOwnership,
    generateRangeProof,
    verifyRange,
    generatePositionSecret,
    generatePositionCommitment,
    storePositionSecret,
    hasStoredSecret,
    getStoredSecretAddresses,
  };
}

// Re-export types for convenience
export type { Groth16Proof, ZKProofResult } from '@/services/zkProof';
