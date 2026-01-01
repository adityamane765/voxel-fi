'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { useZKProof, RangeProofResult } from '@/hooks/useZKProof';
import { ProofResult } from './ProofResult';

// Preset ranges for quick selection
const PRESET_RANGES = [
  { label: 'Whale (>$100k)', min: 100000, max: 10000000 },
  { label: 'Large (>$50k)', min: 50000, max: 10000000 },
  { label: 'Medium (>$10k)', min: 10000, max: 10000000 },
  { label: 'Small (>$1k)', min: 1000, max: 10000000 },
];

interface RangeProofCardProps {
  /** If provided, auto-populates the value from position data */
  positionValue?: number;
  /** If true, the value input is disabled and shows as secured */
  valueFromPosition?: boolean;
}

export function RangeProofCard({ positionValue, valueFromPosition = false }: RangeProofCardProps = {}) {
  const { generateRangeProof, isGenerating } = useZKProof();

  const [value, setValue] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  // Auto-populate value from position if provided
  useEffect(() => {
    if (positionValue !== undefined) {
      setValue(positionValue.toString());
    }
  }, [positionValue]);
  const [showValue, setShowValue] = useState(false);
  const [result, setResult] = useState<RangeProofResult | null>(null);

  const handlePresetSelect = (preset: { min: number; max: number }) => {
    setMin(preset.min.toString());
    setMax(preset.max.toString());
    setResult(null);
  };

  const handleGenerateProof = async () => {
    const valueNum = parseFloat(value);
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);

    if (isNaN(valueNum) || isNaN(minNum) || isNaN(maxNum)) {
      return;
    }

    const proofResult = await generateRangeProof(valueNum, minNum, maxNum);
    setResult(proofResult);
  };

  const isValid =
    value &&
    min &&
    max &&
    !isNaN(parseFloat(value)) &&
    !isNaN(parseFloat(min)) &&
    !isNaN(parseFloat(max)) &&
    parseFloat(value) >= parseFloat(min) &&
    parseFloat(value) <= parseFloat(max);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="border border-white/10 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-white">Generate Range Proof</h3>
          <p className="text-xs text-gray-500">
            Prove a value is within a range
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 p-3 border border-white/5 rounded-xl bg-white/2">
        <p className="text-sm text-gray-400">
          Prove your value is between a minimum and maximum{' '}
          <span className="text-white">without revealing the exact amount</span>. Useful for
          compliance, voting weight, or whale verification.
        </p>
      </div>

      {/* Preset Ranges */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_RANGES.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                min === preset.min.toString() && max === preset.max.toString()
                  ? 'bg-white text-black border-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Value Input (Private) */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
          Your Value <span className="text-gray-600">(kept private)</span>
        </label>
        {valueFromPosition ? (
          // When value comes from position, show secured display
          <div className="relative">
            <div className="w-full pl-8 pr-12 py-3 bg-black border border-green-500/30 rounded-xl text-white flex items-center">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                $
              </span>
              <span className="text-green-400">••••••••</span>
              <span className="ml-2 text-xs text-green-400/70">(from your position)</span>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Lock className="w-4 h-4 text-green-400" />
            </div>
          </div>
        ) : (
          // Manual input when no position value provided
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
              $
            </span>
            <input
              type={showValue ? 'text' : 'password'}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setResult(null);
              }}
              placeholder="Enter your actual value"
              className="w-full pl-8 pr-12 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={() => setShowValue(!showValue)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showValue ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-600 mt-1">
          {valueFromPosition
            ? 'Value automatically fetched from your on-chain position'
            : 'This value is never sent to the blockchain or revealed in the proof'}
        </p>
      </div>

      {/* Min/Max Inputs (Public) */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
            Minimum <span className="text-gray-600">(public)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
              $
            </span>
            <input
              type="number"
              value={min}
              onChange={(e) => {
                setMin(e.target.value);
                setResult(null);
              }}
              placeholder="10000"
              className="w-full pl-8 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
            Maximum <span className="text-gray-600">(public)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
              $
            </span>
            <input
              type="number"
              value={max}
              onChange={(e) => {
                setMax(e.target.value);
                setResult(null);
              }}
              placeholder="1000000"
              className="w-full pl-8 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {value && min && max && !isValid && (
        <p className="text-sm text-red-400 mb-4">
          Value must be between ${min} and ${max}
        </p>
      )}

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerateProof}
        disabled={isGenerating || !isValid}
        className="w-full py-3 bg-white text-black rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Proof...
          </>
        ) : (
          <>
            <Scale className="w-4 h-4" />
            Generate Range Proof
          </>
        )}
      </motion.button>

      {/* Result */}
      {result && (
        <ProofResult
          success={result.success}
          verified={result.verified}
          title={result.success ? 'Range Proof Generated' : 'Proof Generation Failed'}
          description={
            result.success
              ? `Proves value is between $${result.min.toLocaleString()} and $${result.max.toLocaleString()} without revealing the exact amount.`
              : result.error || 'Failed to generate proof'
          }
          proofJson={result.proofJson}
          details={
            result.success
              ? [
                  { label: 'Min (public)', value: `$${result.min.toLocaleString()}` },
                  { label: 'Max (public)', value: `$${result.max.toLocaleString()}` },
                  { label: 'Actual value', value: 'Hidden in proof' },
                ]
              : undefined
          }
          error={result.error}
        />
      )}
    </motion.div>
  );
}
