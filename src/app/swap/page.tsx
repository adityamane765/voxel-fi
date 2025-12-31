'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Settings, Info, Loader2, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
}

const tokens: Token[] = [
  { symbol: 'WETH', name: 'Wrapped ETH', icon: 'E', balance: '1.5' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', balance: '5,000' },
  { symbol: 'MOVE', name: 'Movement', icon: 'M', balance: '10,000' },
];

export default function SwapPage() {
  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);

  // Mock exchange rate calculation
  const calculateOutput = (input: string) => {
    const amount = parseFloat(input) || 0;
    // Mock rate: 1 WETH = 3000 USDC
    const rate = fromToken.symbol === 'WETH' ? 3000 : 1 / 3000;
    return (amount * rate).toFixed(2);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(calculateOutput(value));
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    setIsLoading(true);
    // Simulate swap transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Reset form
    setFromAmount('');
    setToAmount('');
  };

  const priceImpact = '0.05%';
  const minimumReceived = toAmount ? (parseFloat(toAmount) * 0.995).toFixed(2) : '0';
  const fee = fromAmount ? (parseFloat(fromAmount) * 0.003).toFixed(4) : '0';

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/[0.02] rounded-full blur-3xl animate-pulse-slow" />

      <main className="relative pt-32 pb-20 px-6 md:px-8">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-light mb-2">Swap</h1>
            <p className="text-gray-500 text-sm">Trade tokens with private liquidity</p>
          </motion.div>

          {/* Swap Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6"
          >
            {/* Settings */}
            <div className="flex justify-end mb-4">
              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* From Token */}
            <div className="bg-white/[0.02] rounded-2xl p-4 mb-2">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">From</span>
                <span className="text-sm text-gray-500">Balance: {fromToken.balance}</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-3xl font-light outline-none placeholder:text-gray-600"
                />
                <div className="relative">
                  <button
                    onClick={() => setShowFromTokens(!showFromTokens)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                      {fromToken.icon}
                    </span>
                    <span className="font-medium">{fromToken.symbol}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {showFromTokens && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-black border border-white/10 rounded-xl overflow-hidden z-10">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setFromToken(token);
                            setShowFromTokens(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                            {token.icon}
                          </span>
                          <div className="text-left">
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleFromAmountChange(fromToken.balance.replace(',', ''))}
                className="text-xs text-cyan-400 mt-2 hover:text-cyan-300 transition-colors"
              >
                MAX
              </button>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-3 relative z-10">
              <button
                onClick={handleSwapTokens}
                className="w-10 h-10 bg-black border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <ArrowDownUp className="w-4 h-4" />
              </button>
            </div>

            {/* To Token */}
            <div className="bg-white/[0.02] rounded-2xl p-4 mt-2">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">To</span>
                <span className="text-sm text-gray-500">Balance: {toToken.balance}</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-3xl font-light outline-none placeholder:text-gray-600"
                />
                <div className="relative">
                  <button
                    onClick={() => setShowToTokens(!showToTokens)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                      {toToken.icon}
                    </span>
                    <span className="font-medium">{toToken.symbol}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {showToTokens && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-black border border-white/10 rounded-xl overflow-hidden z-10">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setToToken(token);
                            setShowToTokens(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                            {token.icon}
                          </span>
                          <div className="text-left">
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Swap Details */}
            {fromAmount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-white/[0.02] rounded-xl space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    Price Impact
                    <Info className="w-3 h-3" />
                  </span>
                  <span className="text-green-400">{priceImpact}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Minimum received</span>
                  <span>
                    {minimumReceived} {toToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fee (0.3%)</span>
                  <span>
                    {fee} {fromToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Route</span>
                  <span className="text-cyan-400">VoxelFi Pool</span>
                </div>
              </motion.div>
            )}

            {/* Swap Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSwap}
              disabled={!fromAmount || isLoading}
              className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Swapping...
                </>
              ) : !fromAmount ? (
                'Enter an amount'
              ) : (
                'Swap'
              )}
            </motion.button>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.02]"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Private Liquidity</h4>
                <p className="text-sm text-gray-500">
                  Your swap is routed through private fractal liquidity pools. No MEV, no
                  front-running.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
