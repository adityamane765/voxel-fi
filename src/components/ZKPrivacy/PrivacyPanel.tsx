'use client';

import { motion } from 'framer-motion';
import { Lock, Info, Shield } from 'lucide-react';
import { OwnershipProofCard } from './OwnershipProofCard';
import { RangeProofCard } from './RangeProofCard';

interface PrivacyPanelProps {
  /** Total liquidity value from user's positions (in USD) */
  totalLiquidityValue?: number;
}

export function PrivacyPanel({ totalLiquidityValue }: PrivacyPanelProps = {}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Zero-Knowledge Privacy</h2>
          <p className="text-sm text-gray-500">
            Generate cryptographic proofs without revealing sensitive data
          </p>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 border border-white/10 rounded-2xl bg-white/2"
      >
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="font-medium text-white mb-2">How ZK Proofs Work</p>
            <p className="text-gray-500">
              Zero-knowledge proofs let you prove something is true without revealing the
              underlying data. VoxelFi uses <span className="text-white">Groth16</span> proofs with{' '}
              <span className="text-white">Poseidon</span> hashing for efficient, secure verification.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-white mt-0.5" />
                <span>
                  <span className="text-white">Ownership Proof:</span>{' '}
                  <span className="text-gray-500">Prove you own a position without revealing your wallet</span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-white mt-0.5" />
                <span>
                  <span className="text-white">Range Proof:</span>{' '}
                  <span className="text-gray-500">Prove a value is within a range without revealing the exact amount</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Proof Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnershipProofCard />
        <RangeProofCard
          positionValue={totalLiquidityValue}
          valueFromPosition={totalLiquidityValue !== undefined}
        />
      </div>

      {/* Technical Details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 border border-white/10 rounded-2xl"
      >
        <span className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
          Technical Details
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 text-xs">Proof System</span>
            <p className="text-white font-mono">Groth16</p>
          </div>
          <div>
            <span className="text-gray-600 text-xs">Hash Function</span>
            <p className="text-white font-mono">Poseidon</p>
          </div>
          <div>
            <span className="text-gray-600 text-xs">Curve</span>
            <p className="text-white font-mono">BN254</p>
          </div>
          <div>
            <span className="text-gray-600 text-xs">Library</span>
            <p className="text-white font-mono">snarkjs</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
