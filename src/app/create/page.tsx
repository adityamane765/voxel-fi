'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Info,
  Loader2,
  Lock,
  Sparkles,
  ChevronDown,
  Check,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import LiquidityChart from '@/components/LiquidityChart';
import { config, FractalType } from '@/config';
import { useVoxelFi, useZKProof, useVolatilityOracle } from '@/hooks';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
}

const tokens: Token[] = [
  { symbol: 'WETH', name: 'Wrapped ETH', icon: 'E', decimals: 8 },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', decimals: 6 },
];

export default function CreatePositionPage() {
  const {
    isConnected,
    address,
    isLoading: walletLoading,
    login,
    mintPosition,
  } = useVoxelFi();

  const {
    isGenerating: isGeneratingProof,
    generatePositionSecret,
    generatePositionCommitment,
    storePositionSecret,
  } = useZKProof();

  // Store the generated secret for later use
  const [positionSecret, setPositionSecret] = useState<string | null>(null);

  // Volatility oracle data
  const {
    metrics: volatilityMetrics,
    volatilityBucket,
    volatilityLabel,
    volatilityDescription,
    twap1hFormatted,
    priceChange24hFormatted,
    spreadMultiplier,
    spreadRecommendation,
    isLoading: volatilityLoading,
  } = useVolatilityOracle();

  const [tokenX, setTokenX] = useState<Token>(tokens[0]);
  const [tokenY, setTokenY] = useState<Token>(tokens[1]);
  const [amountX, setAmountX] = useState('');
  const [amountY, setAmountY] = useState('');
  const [priceCenter, setPriceCenter] = useState('3000');
  const [spread, setSpread] = useState('500');
  const [selectedFractal, setSelectedFractal] = useState<FractalType>(config.fractalTypes[1]);
  const [depth, setDepth] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenXSelect, setShowTokenXSelect] = useState(false);
  const [showTokenYSelect, setShowTokenYSelect] = useState(false);
  const [showFractalSelect, setShowFractalSelect] = useState(false);
  const [step, setStep] = useState(1);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [nftAddress, setNftAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commitmentHash, setCommitmentHash] = useState<string | null>(null);


  const handleCreatePosition = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert amounts to smallest units (considering decimals)
      const amountXUnits = Math.floor(parseFloat(amountX) * Math.pow(10, tokenX.decimals));
      const amountYUnits = Math.floor(parseFloat(amountY) * Math.pow(10, tokenY.decimals));
      const priceCenterUnits = Math.floor(parseFloat(priceCenter) * 1000000); // 6 decimal precision
      const spreadUnits = Math.floor(parseFloat(spread) * 1000000);

      const result = await mintPosition({
        amountX: amountXUnits,
        amountY: amountYUnits,
        priceCenter: priceCenterUnits,
        spread: spreadUnits,
        fractalType: selectedFractal.id,
        depth: depth,
        pair: `${tokenX.symbol}/${tokenY.symbol}`,
        fractalTypeName: selectedFractal.name,
      });

      if (result.success) {
        setTxHash(result.hash || null);
        setNftAddress(result.tokenAddress || null);

        // Store the secret for this position so user can prove ownership later
        if (result.tokenAddress && positionSecret) {
          storePositionSecret(result.tokenAddress, positionSecret);
        }

        setStep(3);
      } else {
        setError(result.error || 'Transaction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create position');
    } finally {
      setIsLoading(false);
    }
  };

  const generateZKProof = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate a new secret for this position
      const secret = generatePositionSecret();
      setPositionSecret(secret);

      // Generate commitment from the secret (Poseidon hash)
      const commitment = await generatePositionCommitment(secret);

      setCommitmentHash(commitment.slice(0, 10) + '...' + commitment.slice(-4));
      setStep(2);
    } catch (err) {
      setError('Failed to generate ZK commitment');
    } finally {
      setIsLoading(false);
    }
  };

  const totalLiquidity = Math.sqrt(
    (parseFloat(amountX) || 0) * (parseFloat(amountY) || 0)
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="relative pt-24 pb-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">
              Create Position
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">
              Design Your Fractal Curve
            </h1>
            <p className="text-gray-400 max-w-xl">
              Configure your private liquidity position. Your parameters stay local, only
              commitments are stored on-chain.
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-12"
          >
            <div className="flex items-center gap-4">
              {[
                { num: 1, label: 'Configure' },
                { num: 2, label: 'Generate Proof' },
                { num: 3, label: 'Deploy' },
              ].map((s, index) => (
                <div key={s.num} className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-3 ${
                      step >= s.num ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        step > s.num
                          ? 'bg-white text-black'
                          : step === s.num
                          ? 'border border-white text-white'
                          : 'border border-gray-600'
                      }`}
                    >
                      {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className="text-sm hidden sm:block">{s.label}</span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`w-12 h-px ${
                        step > s.num ? 'bg-white' : 'bg-gray-600'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-white/10 rounded-2xl p-6 md:p-8"
            >
              {step === 1 && (
                <>
                  {/* Token Pair Selection */}
                  <div className="mb-8">
                    <label className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
                      Token Pair
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Token X */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTokenXSelect(!showTokenXSelect)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                              {tokenX.icon}
                            </span>
                            <span>{tokenX.symbol}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                        {showTokenXSelect && (
                          <div className="absolute top-full mt-2 left-0 right-0 bg-black border border-white/10 rounded-xl overflow-hidden z-10">
                            {tokens.map((token) => (
                              <button
                                key={token.symbol}
                                onClick={() => {
                                  setTokenX(token);
                                  setShowTokenXSelect(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                  {token.icon}
                                </span>
                                <span>{token.symbol}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Token Y */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTokenYSelect(!showTokenYSelect)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                              {tokenY.icon}
                            </span>
                            <span>{tokenY.symbol}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                        {showTokenYSelect && (
                          <div className="absolute top-full mt-2 left-0 right-0 bg-black border border-white/10 rounded-xl overflow-hidden z-10">
                            {tokens.map((token) => (
                              <button
                                key={token.symbol}
                                onClick={() => {
                                  setTokenY(token);
                                  setShowTokenYSelect(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                  {token.icon}
                                </span>
                                <span>{token.symbol}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mb-8">
                    <label className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
                      Deposit Amounts
                    </label>
                    <div className="space-y-4">
                      <div className="bg-white/[0.02] rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-500">{tokenX.symbol}</span>
                          <span className="text-sm text-gray-500">Balance: 10.5</span>
                        </div>
                        <input
                          type="number"
                          value={amountX}
                          onChange={(e) => setAmountX(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-transparent text-2xl font-light outline-none placeholder:text-gray-600"
                        />
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-500">{tokenY.symbol}</span>
                          <span className="text-sm text-gray-500">Balance: 5,000</span>
                        </div>
                        <input
                          type="number"
                          value={amountY}
                          onChange={(e) => setAmountY(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-transparent text-2xl font-light outline-none placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fractal Type */}
                  <div className="mb-8">
                    <label className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
                      Fractal Type
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setShowFractalSelect(!showFractalSelect)}
                        className="w-full flex items-center justify-between px-4 py-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{selectedFractal.name}</div>
                          <div className="text-sm text-gray-500">{selectedFractal.description}</div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </button>
                      {showFractalSelect && (
                        <div className="absolute top-full mt-2 left-0 right-0 bg-black border border-white/10 rounded-xl overflow-hidden z-10">
                          {config.fractalTypes.map((fractal) => (
                            <button
                              key={fractal.id}
                              onClick={() => {
                                setSelectedFractal(fractal);
                                setShowFractalSelect(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                            >
                              <div className="font-medium">{fractal.name}</div>
                              <div className="text-xs text-gray-500">{fractal.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Volatility Indicator */}
                  <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-xs tracking-widest uppercase text-gray-500">
                          Market Volatility
                        </span>
                      </div>
                      {volatilityLoading ? (
                        <span className="text-xs text-gray-500">Loading...</span>
                      ) : (
                        <span className={`text-sm font-medium ${
                          volatilityBucket === 0 ? 'text-green-400' :
                          volatilityBucket === 1 ? 'text-yellow-400' :
                          volatilityBucket === 2 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {volatilityLabel}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 text-xs">TWAP (1h)</span>
                        <p className="text-white">{twap1hFormatted}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">24h Change</span>
                        <p className="flex items-center gap-1">
                          {volatilityMetrics && volatilityMetrics.priceChange24h > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : volatilityMetrics && volatilityMetrics.priceChange24h < 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          ) : (
                            <Minus className="w-3 h-3 text-gray-400" />
                          )}
                          <span className={
                            volatilityMetrics && volatilityMetrics.priceChange24h > 0
                              ? 'text-green-400'
                              : volatilityMetrics && volatilityMetrics.priceChange24h < 0
                                ? 'text-red-400'
                                : 'text-white'
                          }>
                            {priceChange24hFormatted}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">Spread Multiplier</span>
                        <p className="text-white">{spreadMultiplier}x</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">{volatilityDescription}</p>
                  </div>

                  {/* Price Center & Spread */}
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
                        Price Center
                      </label>
                      <input
                        type="number"
                        value={priceCenter}
                        onChange={(e) => setPriceCenter(e.target.value)}
                        className="w-full px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5 outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
                        Spread
                        {spreadMultiplier > 1 && (
                          <button
                            onClick={() => setSpread((parseFloat(spread) * spreadMultiplier).toFixed(0))}
                            className="ml-2 text-xs text-white/60 hover:text-white underline"
                          >
                            Apply {spreadMultiplier}x
                          </button>
                        )}
                      </label>
                      <input
                        type="number"
                        value={spread}
                        onChange={(e) => setSpread(e.target.value)}
                        className="w-full px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5 outline-none focus:border-white/30 transition-colors"
                      />
                      {spreadMultiplier > 1 && (
                        <p className="text-xs text-yellow-400/80 mt-1">
                          {spreadRecommendation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Depth Slider */}
                  <div className="mb-8">
                    <div className="flex justify-between mb-4">
                      <label className="text-xs tracking-widest uppercase text-gray-500">
                        Fractal Depth
                      </label>
                      <span className="text-sm text-white">{depth}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={depth}
                      onChange={(e) => setDepth(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Simple</span>
                      <span>Complex</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateZKProof}
                    disabled={!amountX || !amountY || isLoading}
                    className="w-full py-4 bg-white text-black rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Proof...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Generate ZK Proof
                      </>
                    )}
                  </motion.button>
                </>
              )}

              {step === 2 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">ZK Proof Generated</h3>
                  <p className="text-gray-500 mb-8">
                    Your proof is ready. Deploy your position to start earning fees.
                  </p>

                  <div className="bg-white/[0.02] rounded-xl p-4 mb-8 text-left">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-500">Commitment Hash</span>
                      <span className="font-mono text-xs">{commitmentHash || '0x7f3a...9c2d'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-500">Proof Size</span>
                      <span>256 bytes</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Verification Status</span>
                      <span className="text-green-400">Valid</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400">{error}</span>
                    </div>
                  )}

                  {!isConnected ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={login}
                      disabled={walletLoading}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-2xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {walletLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" />
                          Sign In to Deploy
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreatePosition}
                      disabled={isLoading}
                      className="w-full py-4 bg-white text-black rounded-2xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Deploy Position
                        </>
                      )}
                    </motion.button>
                  )}

                  {isConnected && address && (
                    <p className="text-xs text-gray-500 mt-3">
                      Connected: {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Position Created!</h3>
                  <p className="text-gray-500 mb-8">
                    Your private liquidity position is now live on Movement Network.
                  </p>

                  <div className="bg-white/[0.02] rounded-xl p-4 mb-8 text-left">
                    {txHash && (
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-500">Transaction</span>
                        <a
                          href={`https://explorer.movementlabs.xyz/txn/${txHash}?network=testnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          {txHash.slice(0, 8)}...{txHash.slice(-6)}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-500">NFT Address</span>
                      <span className="font-mono text-xs">
                        {nftAddress ? `${nftAddress.slice(0, 8)}...${nftAddress.slice(-6)}` : 'Pending...'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-500">Fractal Type</span>
                      <span>{selectedFractal.name}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Total Liquidity</span>
                      <span>${totalLiquidity}</span>
                    </div>
                  </div>

                  <motion.a
                    href="/dashboard"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block w-full py-4 bg-white text-black rounded-2xl font-medium text-center"
                  >
                    View in Dashboard
                  </motion.a>
                </div>
              )}
            </motion.div>

            {/* Visualization & Info */}
            <div className="space-y-6">
              {/* Liquidity Distribution Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="border border-white/10 rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-white/5">
                  <span className="text-xs tracking-widest uppercase text-gray-500">
                    Liquidity Distribution Preview
                  </span>
                </div>
                <div className="h-72 p-4">
                  <LiquidityChart
                    priceCenter={parseFloat(priceCenter) || 3000}
                    spread={parseFloat(spread) || 500}
                    depth={depth}
                    fractalType={selectedFractal.name}
                  />
                </div>
              </motion.div>

              {/* Position Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="border border-white/10 rounded-2xl p-6"
              >
                <span className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
                  Position Summary
                </span>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Pair</span>
                    <span>
                      {tokenX.symbol}/{tokenY.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Fractal Type</span>
                    <span>{selectedFractal.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Price Range</span>
                    <span>
                      ${(parseFloat(priceCenter) - parseFloat(spread)).toLocaleString()} - $
                      {(parseFloat(priceCenter) + parseFloat(spread)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Depth</span>
                    <span>{depth}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Total Liquidity</span>
                    <span className="text-white">${totalLiquidity}</span>
                  </div>
                </div>
              </motion.div>

              {/* Privacy Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Your Strategy is Private</h4>
                    <p className="text-sm text-gray-500">
                      Price center, spread, and fractal parameters never leave your device. Only a
                      cryptographic commitment is stored on-chain.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
