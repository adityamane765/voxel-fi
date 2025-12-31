'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Settings, Info, Loader2, ChevronDown, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useVoxelFi } from '@/hooks';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  decimals: number;
}

const tokens: Token[] = [
  { symbol: 'WETH', name: 'Wrapped ETH', icon: 'E', balance: '0', decimals: 8 },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', balance: '0', decimals: 6 },
];

export default function SwapPage() {
  const {
    isConnected,
    address,
    isLoading: walletLoading,
    login,
    swap,
    getSwapQuote,
    getVaultReserves,
  } = useVoxelFi();

  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(0.5); // 0.5%
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState(false);
  const [reserves, setReserves] = useState({ reserveX: 0, reserveY: 0 });
  const [priceImpact, setPriceImpact] = useState(0);
  const [minimumReceived, setMinimumReceived] = useState(0);
  const [fee, setFee] = useState(0);

  // Load reserves on mount
  useEffect(() => {
    const loadReserves = async () => {
      try {
        const res = await getVaultReserves();
        setReserves(res);
      } catch (err) {
        console.error('Failed to load reserves:', err);
      }
    };
    loadReserves();
  }, [getVaultReserves]);

  // Calculate output with debounce
  const calculateOutput = useCallback(async (input: string) => {
    const amount = parseFloat(input) || 0;
    if (amount <= 0) {
      setToAmount('');
      setPriceImpact(0);
      setMinimumReceived(0);
      setFee(0);
      return;
    }

    setIsQuoteLoading(true);
    try {
      // Convert to smallest units
      const amountInUnits = Math.floor(amount * Math.pow(10, fromToken.decimals));
      const quote = await getSwapQuote(amountInUnits, slippage * 100);

      // Convert back to display units
      const outputAmount = quote.amountOut / Math.pow(10, toToken.decimals);
      setToAmount(outputAmount.toFixed(toToken.decimals === 6 ? 2 : 6));
      setPriceImpact(quote.priceImpact);
      setMinimumReceived(quote.minimumReceived / Math.pow(10, toToken.decimals));
      setFee(quote.fee / Math.pow(10, fromToken.decimals));
    } catch (err) {
      console.error('Quote error:', err);
      // Fallback to simple calculation based on reserves
      const spotPrice = reserves.reserveY / reserves.reserveX;
      const estimatedOutput = amount * spotPrice * 0.997; // 0.3% fee
      setToAmount(estimatedOutput.toFixed(2));
      setFee(amount * 0.003);
    } finally {
      setIsQuoteLoading(false);
    }
  }, [fromToken, toToken, slippage, getSwapQuote, reserves]);

  // Debounced input change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount) {
        calculateOutput(fromAmount);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fromAmount, calculateOutput]);

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setError(null);
    setTxSuccess(false);
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter an amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxSuccess(false);

    try {
      const amountInUnits = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));
      const minOutUnits = Math.floor(minimumReceived * Math.pow(10, toToken.decimals));
      const direction = fromToken.symbol === 'WETH' ? 'xToY' : 'yToX';

      const result = await swap(amountInUnits, minOutUnits, direction as 'xToY' | 'yToX');

      if (result.success) {
        setTxHash(result.hash || null);
        setTxSuccess(true);
        setFromAmount('');
        setToAmount('');
        // Reload reserves
        const newReserves = await getVaultReserves();
        setReserves(newReserves);
      } else {
        setError(result.error || 'Swap failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setIsLoading(false);
    }
  };

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
                  <span className={priceImpact > 1 ? 'text-yellow-400' : 'text-green-400'}>
                    {priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Minimum received</span>
                  <span>
                    {minimumReceived.toFixed(toToken.decimals === 6 ? 2 : 6)} {toToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fee (0.3%)</span>
                  <span>
                    {fee.toFixed(fromToken.decimals === 8 ? 6 : 2)} {fromToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Slippage</span>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {slippage}%
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Route</span>
                  <span className="text-cyan-400">VoxelFi Pool</span>
                </div>
              </motion.div>
            )}

            {/* Slippage Settings */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 p-4 bg-white/[0.02] rounded-xl"
              >
                <div className="text-sm text-gray-500 mb-2">Slippage Tolerance</div>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        slippage === val ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                    className="w-20 px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 outline-none"
                    placeholder="Custom"
                  />
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {txSuccess && txHash && (
              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-green-400">Swap successful! </span>
                  <a
                    href={`https://explorer.movementlabs.xyz/txn/${txHash}?network=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    View transaction
                  </a>
                </div>
              </div>
            )}

            {/* Swap Button */}
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={login}
                disabled={walletLoading}
                className="w-full mt-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-2xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {walletLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Sign In to Swap
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSwap}
                disabled={!fromAmount || isLoading || isQuoteLoading}
                className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Swapping...
                  </>
                ) : isQuoteLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting quote...
                  </>
                ) : !fromAmount ? (
                  'Enter an amount'
                ) : (
                  'Swap'
                )}
              </motion.button>
            )}

            {isConnected && address && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
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
