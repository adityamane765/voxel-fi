'use client';

/**
 * Browser-compatible ZK Proof Service
 *
 * Uses snarkjs for Groth16 proof generation/verification
 * Uses circomlibjs for Poseidon hashing
 *
 * Circuit files are served from /public/zk/
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Dynamic imports for browser compatibility
let snarkjs: any = null;
let poseidonInstance: any = null;

// Circuit file paths (served from public folder)
const CIRCUIT_PATHS = {
  ownership: {
    wasm: '/zk/ownership.wasm',
    zkey: '/zk/ownership.zkey',
    vkey: '/zk/ownership_vk.json',
  },
  range: {
    wasm: '/zk/range_proof.wasm',
    zkey: '/zk/range.zkey',
    vkey: '/zk/range_vk.json',
  },
};

// Proof structure matching Groth16 output
export interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface ZKProofResult {
  success: boolean;
  verified: boolean;
  proof: Groth16Proof | null;
  publicSignals: string[];
  error?: string;
}

export interface OwnershipProofInput {
  secret: string;
  commitment: string;
}

export interface RangeProofInput {
  value: number;
  min: number;
  max: number;
}

/**
 * Initialize snarkjs (lazy load for browser)
 */
async function initSnarkjs(): Promise<any> {
  if (!snarkjs) {
    snarkjs = await import('snarkjs');
  }
  return snarkjs;
}

/**
 * Initialize Poseidon hasher (lazy load for browser)
 */
async function initPoseidon(): Promise<any> {
  if (!poseidonInstance) {
    const circomlibjs = await import('circomlibjs');
    poseidonInstance = await circomlibjs.buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Compute Poseidon hash of inputs
 */
export async function poseidonHash(inputs: bigint[]): Promise<string> {
  const poseidon = await initPoseidon();
  const hash = poseidon(inputs);
  return poseidon.F.toString(hash);
}

/**
 * Generate a random secret for position creation
 */
export function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate commitment from secret (Poseidon hash)
 */
export async function generateCommitment(secret: string): Promise<string> {
  const secretBigInt = BigInt('0x' + secret);
  return poseidonHash([secretBigInt]);
}

/**
 * Fetch verification key from server
 */
async function fetchVerificationKey(path: string): Promise<object> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch verification key: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Generate Ownership Proof
 *
 * Proves knowledge of a secret that hashes to a known commitment
 * without revealing the secret itself.
 */
export async function generateOwnershipProof(
  secret: string
): Promise<ZKProofResult> {
  try {
    const snarks = await initSnarkjs();

    // Convert secret to bigint
    const secretBigInt = BigInt('0x' + secret);

    // Compute commitment
    const commitment = await poseidonHash([secretBigInt]);

    // Prepare circuit input
    const input = {
      secret: secretBigInt.toString(),
      commitment: commitment,
    };

    console.log('Generating ownership proof with input:', {
      secret: '***hidden***',
      commitment
    });

    // Generate proof
    const { proof, publicSignals } = await snarks.groth16.fullProve(
      input,
      CIRCUIT_PATHS.ownership.wasm,
      CIRCUIT_PATHS.ownership.zkey
    );

    // Fetch verification key and verify
    const vkey = await fetchVerificationKey(CIRCUIT_PATHS.ownership.vkey);
    const verified = await snarks.groth16.verify(vkey, publicSignals, proof);

    console.log('Ownership proof generated:', { verified, publicSignals });

    return {
      success: true,
      verified,
      proof: proof as Groth16Proof,
      publicSignals,
    };
  } catch (error) {
    console.error('Failed to generate ownership proof:', error);
    return {
      success: false,
      verified: false,
      proof: null,
      publicSignals: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify an Ownership Proof
 */
export async function verifyOwnershipProof(
  proof: Groth16Proof,
  publicSignals: string[]
): Promise<boolean> {
  try {
    const snarks = await initSnarkjs();
    const vkey = await fetchVerificationKey(CIRCUIT_PATHS.ownership.vkey);
    return await snarks.groth16.verify(vkey, publicSignals, proof);
  } catch (error) {
    console.error('Failed to verify ownership proof:', error);
    return false;
  }
}

/**
 * Generate Range Proof
 *
 * Proves a value lies within [min, max] without revealing the exact value.
 */
export async function generateRangeProof(
  value: number,
  min: number,
  max: number
): Promise<ZKProofResult> {
  try {
    // Validate inputs
    if (value < min || value > max) {
      return {
        success: false,
        verified: false,
        proof: null,
        publicSignals: [],
        error: `Value ${value} is outside range [${min}, ${max}]`,
      };
    }

    const snarks = await initSnarkjs();

    // Compute commitment of the value
    const valueCommitment = await poseidonHash([BigInt(value)]);

    // Prepare circuit input
    const input = {
      value: value.toString(),
      min: min.toString(),
      max: max.toString(),
      commitment: valueCommitment,
    };

    console.log('Generating range proof with input:', {
      value: '***hidden***',
      min,
      max,
    });

    // Generate proof
    const { proof, publicSignals } = await snarks.groth16.fullProve(
      input,
      CIRCUIT_PATHS.range.wasm,
      CIRCUIT_PATHS.range.zkey
    );

    // Fetch verification key and verify
    const vkey = await fetchVerificationKey(CIRCUIT_PATHS.range.vkey);
    const verified = await snarks.groth16.verify(vkey, publicSignals, proof);

    console.log('Range proof generated:', { verified, publicSignals });

    return {
      success: true,
      verified,
      proof: proof as Groth16Proof,
      publicSignals,
    };
  } catch (error) {
    console.error('Failed to generate range proof:', error);
    return {
      success: false,
      verified: false,
      proof: null,
      publicSignals: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify a Range Proof
 */
export async function verifyRangeProof(
  proof: Groth16Proof,
  publicSignals: string[]
): Promise<boolean> {
  try {
    const snarks = await initSnarkjs();
    const vkey = await fetchVerificationKey(CIRCUIT_PATHS.range.vkey);
    return await snarks.groth16.verify(vkey, publicSignals, proof);
  } catch (error) {
    console.error('Failed to verify range proof:', error);
    return false;
  }
}

/**
 * Secret storage utilities (localStorage)
 * Secrets are stored locally and never sent to the blockchain
 */
export const SecretStorage = {
  /**
   * Store a secret for a position
   */
  storeSecret(tokenAddress: string, secret: string): void {
    if (typeof window === 'undefined') return;

    const secrets = JSON.parse(localStorage.getItem('voxelfi_secrets') || '{}');
    secrets[tokenAddress.toLowerCase()] = secret;
    localStorage.setItem('voxelfi_secrets', JSON.stringify(secrets));
  },

  /**
   * Retrieve a secret for a position
   */
  getSecret(tokenAddress: string): string | null {
    if (typeof window === 'undefined') return null;

    const secrets = JSON.parse(localStorage.getItem('voxelfi_secrets') || '{}');
    return secrets[tokenAddress.toLowerCase()] || null;
  },

  /**
   * Check if we have a secret for a position
   */
  hasSecret(tokenAddress: string): boolean {
    return this.getSecret(tokenAddress) !== null;
  },

  /**
   * Remove a secret (after position is burned)
   */
  removeSecret(tokenAddress: string): void {
    if (typeof window === 'undefined') return;

    const secrets = JSON.parse(localStorage.getItem('voxelfi_secrets') || '{}');
    delete secrets[tokenAddress.toLowerCase()];
    localStorage.setItem('voxelfi_secrets', JSON.stringify(secrets));
  },

  /**
   * Get all stored token addresses
   */
  getAllTokenAddresses(): string[] {
    if (typeof window === 'undefined') return [];

    const secrets = JSON.parse(localStorage.getItem('voxelfi_secrets') || '{}');
    return Object.keys(secrets);
  },
};

/**
 * Format proof for display (truncated)
 */
export function formatProofForDisplay(proof: Groth16Proof): string {
  const proofStr = JSON.stringify(proof);
  if (proofStr.length > 100) {
    return proofStr.substring(0, 50) + '...' + proofStr.substring(proofStr.length - 50);
  }
  return proofStr;
}

/**
 * Export proof as JSON string for sharing
 */
export function exportProof(proof: Groth16Proof, publicSignals: string[]): string {
  return JSON.stringify({ proof, publicSignals }, null, 2);
}
