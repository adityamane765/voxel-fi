'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, Key, AlertCircle } from 'lucide-react';
import { useZKProof, OwnershipProofResult } from '@/hooks/useZKProof';
import { ProofResult } from './ProofResult';

export function OwnershipProofCard() {
  const { generateOwnershipProof, isGenerating, hasStoredSecret, getStoredSecretAddresses } = useZKProof();

  const [tokenAddress, setTokenAddress] = useState('');
  const [result, setResult] = useState<OwnershipProofResult | null>(null);
  const [hasSecret, setHasSecret] = useState<boolean | null>(null);

  // Get list of addresses with stored secrets
  const storedAddresses = getStoredSecretAddresses();

  const handleAddressChange = (address: string) => {
    setTokenAddress(address);
    setResult(null);
    if (address.length > 10) {
      setHasSecret(hasStoredSecret(address));
    } else {
      setHasSecret(null);
    }
  };

  const handleGenerateProof = async () => {
    if (!tokenAddress) return;

    const proofResult = await generateOwnershipProof(tokenAddress);
    setResult(proofResult);
  };

  const handleSelectStoredAddress = (address: string) => {
    setTokenAddress(address);
    setHasSecret(true);
    setResult(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/10 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-white">Prove Position Ownership</h3>
          <p className="text-xs text-gray-500">
            Generate a ZK proof that you own a position
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 p-3 border border-white/5 rounded-xl bg-white/2">
        <p className="text-sm text-gray-400">
          This proves you own a position NFT <span className="text-white">without revealing your wallet address</span>.
          The proof can be shared with anyone for verification.
        </p>
      </div>

      {/* Stored Addresses Quick Select */}
      {storedAddresses.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
            Your Positions
          </label>
          <div className="flex flex-wrap gap-2">
            {storedAddresses.map((addr) => (
              <button
                key={addr}
                onClick={() => handleSelectStoredAddress(addr)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  tokenAddress === addr
                    ? 'bg-white text-black border-white'
                    : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {addr.slice(0, 6)}...{addr.slice(-4)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
          Position NFT Address
        </label>
        <div className="relative">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-white/30 font-mono text-sm"
          />
          {hasSecret !== null && tokenAddress.length > 10 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2" title={hasSecret ? "Secret found" : "No secret found"}>
              {hasSecret ? (
                <Key className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              )}
            </div>
          )}
        </div>
        {hasSecret === false && tokenAddress.length > 10 && (
          <p className="text-xs text-gray-500 mt-2">
            No secret found for this address. You can only prove ownership for positions created on this device.
          </p>
        )}
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerateProof}
        disabled={isGenerating || !tokenAddress || hasSecret === false}
        className="w-full py-3 bg-white text-black rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Proof...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Verify Ownership
          </>
        )}
      </motion.button>

      {/* Result */}
      {result && (
        <ProofResult
          success={result.success}
          verified={result.verified}
          title={result.success ? 'Ownership Verified' : 'Cannot Prove Ownership'}
          description={
            result.success
              ? 'You own this position. ZK proof generated successfully.'
              : result.error || 'Failed to generate proof'
          }
          proofJson={result.proofJson}
          details={
            result.success && result.commitment
              ? [
                  { label: 'Commitment', value: result.commitment },
                  { label: 'Public Signals', value: result.publicSignals.join(', ') },
                ]
              : undefined
          }
          error={result.error}
        />
      )}
    </motion.div>
  );
}
