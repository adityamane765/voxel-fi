'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Copy, CheckCheck } from 'lucide-react';

interface ProofResultProps {
  success: boolean;
  verified: boolean;
  title: string;
  description: string;
  proofJson?: string;
  details?: { label: string; value: string }[];
  error?: string;
}

export function ProofResult({
  success,
  verified,
  title,
  description,
  proofJson,
  details,
  error,
}: ProofResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (proofJson) {
      await navigator.clipboard.writeText(proofJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 border border-red-500/20 rounded-xl"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full border border-red-500/20 flex items-center justify-center bg-red-500/10">
            <X className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h4 className="font-medium text-red-400">{title}</h4>
            <p className="text-sm text-gray-500 mt-1">{error || description}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 border border-green-500/20 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full border border-green-500/20 flex items-center justify-center bg-green-500/10">
          <Check className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-green-400">{title}</h4>
            {verified && (
              <span className="text-xs px-2 py-1 border border-green-500/20 text-green-400 rounded-full">
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{description}</p>

          {/* Details */}
          {details && details.length > 0 && (
            <div className="mt-3 space-y-1">
              {details.map((detail, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{detail.label}:</span>
                  <span className="text-gray-400 font-mono text-xs">
                    {detail.value.length > 20
                      ? `${detail.value.slice(0, 10)}...${detail.value.slice(-10)}`
                      : detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Proof JSON */}
          {proofJson && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Proof Data</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Proof
                    </>
                  )}
                </button>
              </div>
              <div className="p-2 bg-black rounded-lg border border-white/5 overflow-hidden">
                <pre className="text-xs text-gray-500 overflow-x-auto">
                  {proofJson.length > 200
                    ? proofJson.slice(0, 200) + '...'
                    : proofJson}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
