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
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import LiquidityChart from '@/components/LiquidityChart';
import { config, FractalType } from '@/config';

interface Token {
  symbol: string;
  name: string;
  icon: string;
}

const tokens: Token[] = [
  { symbol: 'WETH', name: 'Wrapped ETH', icon: 'E' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
  { symbol: 'MOVE', name: 'Movement', icon: 'M' },
];

export default function CreatePositionPage() {
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

  const handleCreatePosition = async () => {
    setIsLoading(true);
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsLoading(false);
    setStep(3);
  };

  const generateZKProof = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setStep(2);
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
                      </label>
                      <input
                        type="number"
                        value={spread}
                        onChange={(e) => setSpread(e.target.value)}
                        className="w-full px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5 outline-none focus:border-white/30 transition-colors"
                      />
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
                      <span className="font-mono text-xs">0x7f3a...9c2d</span>
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
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-500">Position ID</span>
                      <span className="font-mono">#42</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-500">NFT Address</span>
                      <span className="font-mono text-xs">0x1bb2...29da</span>
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
