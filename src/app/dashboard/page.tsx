'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  EyeOff,
  Plus,
  ArrowUpRight,
  Wallet,
  RefreshCw,
  X,
  DollarSign,
  Activity,
  Shield,
  Zap,
  Target,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import type { Position } from '@/components/LiquidityUniverse';

// Dynamically import 3D scene
const LiquidityUniverse = dynamic(() => import('@/components/LiquidityUniverse'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading Liquidity Universe...</p>
      </div>
    </div>
  ),
});

// Extended mock positions with full spatial octree data
const mockPositions: Position[] = [
  {
    id: 1,
    pair: 'WETH/USDC',
    type: 'Fibonacci',
    liquidity: 8500,
    priceCenter: 3000,
    spread: 500,
    volatilityBucket: 1,
    depth: 2,
    earnings: 312.5,
    apr: 14.7,
    healthScore: 92,
    isActive: true,
  },
  {
    id: 2,
    pair: 'MOVE/USDC',
    type: 'Cantor',
    liquidity: 6200,
    priceCenter: 500,
    spread: 100,
    volatilityBucket: 2,
    depth: 3,
    earnings: 489.18,
    apr: 31.5,
    healthScore: 78,
    isActive: true,
  },
  {
    id: 3,
    pair: 'WETH/MOVE',
    type: 'Binary',
    liquidity: 10192,
    priceCenter: 6000,
    spread: 800,
    volatilityBucket: 1,
    depth: 1,
    earnings: 445.39,
    apr: 17.4,
    healthScore: 85,
    isActive: true,
  },
  {
    id: 4,
    pair: 'WETH/USDC',
    type: 'Linear',
    liquidity: 4500,
    priceCenter: 2800,
    spread: 300,
    volatilityBucket: 0,
    depth: 4,
    earnings: 156.2,
    apr: 13.9,
    healthScore: 65,
    isActive: true,
  },
  {
    id: 5,
    pair: 'MOVE/USDC',
    type: 'Exponential',
    liquidity: 12000,
    priceCenter: 550,
    spread: 150,
    volatilityBucket: 3,
    depth: 2,
    earnings: 892.4,
    apr: 29.7,
    healthScore: 45,
    isActive: true,
  },
];

const activity = [
  { action: 'Fees collected', amount: '+$12.45', time: '2m ago', type: 'earn' },
  { action: 'Position opened', amount: '$5,000', time: '1h ago', type: 'create' },
  { action: 'ZK Proof verified', amount: '', time: '5h ago', type: 'verify' },
  { action: 'Swap executed', amount: '$1,234', time: '8h ago', type: 'swap' },
];

// Health score indicator
function HealthIndicator({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-400 bg-green-400/10';
    if (score >= 50) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  const getIcon = () => {
    if (score >= 80) return <Heart className="w-3 h-3" />;
    if (score >= 50) return <Target className="w-3 h-3" />;
    return <AlertTriangle className="w-3 h-3" />;
  };

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getColor()}`}>
      {getIcon()}
      {score}%
    </div>
  );
}

export default function DashboardPage() {
  const [positions] = useState<Position[]>(mockPositions);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [view, setView] = useState<'3d' | 'list'>('3d');

  const totalValue = positions.reduce((sum, p) => sum + p.liquidity, 0);
  const totalEarnings = positions.reduce((sum, p) => sum + p.earnings, 0);
  const avgApr = positions.reduce((sum, p) => sum + p.apr, 0) / positions.length;

  const stats = [
    {
      label: 'Total Value',
      value: `$${totalValue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: 'Total Earnings',
      value: `+$${totalEarnings.toLocaleString()}`,
      icon: TrendingUp,
      positive: true,
    },
    {
      label: 'Avg. APR',
      value: `${avgApr.toFixed(1)}%`,
      icon: Zap,
      positive: true,
    },
    {
      label: 'Privacy Status',
      value: 'Protected',
      icon: Shield,
      special: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="relative pt-24 pb-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6"
          >
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
                Liquidity Universe
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-white/5 rounded-full p-1">
                <button
                  onClick={() => setView('3d')}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    view === '3d' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  3D View
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    view === 'list' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-sm hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
              <Link href="/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Position
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden mb-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="bg-black p-6">
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon
                    className={`w-4 h-4 ${stat.special ? 'text-white' : 'text-gray-500'}`}
                  />
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{stat.label}</p>
                </div>
                <p
                  className={`text-2xl md:text-3xl font-light ${
                    stat.positive ? 'text-green-400' : stat.special ? 'text-white' : 'text-white'
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {view === '3d' ? (
              <motion.div
                key="3d"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid lg:grid-cols-3 gap-6"
              >
                {/* 3D Universe - Main View */}
                <div className="lg:col-span-2 border border-white/10 rounded-3xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs tracking-widest uppercase text-gray-500">
                        Spatial Liquidity Map
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Click on a voxel to view position details
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/50"></span> Price
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/30"></span> Volatility
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/20"></span> Depth
                      </span>
                    </div>
                  </div>
                  <div className="h-[500px]">
                    <LiquidityUniverse
                      positions={positions}
                      selectedPosition={selectedPosition}
                      onSelectPosition={setSelectedPosition}
                    />
                  </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                  {/* Selected Position Details */}
                  <AnimatePresence mode="wait">
                    {selectedPosition ? (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="border border-white/10 rounded-2xl p-6"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                              <span className="font-medium">
                                {selectedPosition.pair.split('/')[0].charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium">{selectedPosition.pair}</h3>
                              <p className="text-xs text-gray-500">{selectedPosition.type} Curve</p>
                            </div>
                          </div>
                          <HealthIndicator score={selectedPosition.healthScore} />
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">Value</span>
                            <span className="font-medium">${selectedPosition.liquidity.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">Earnings</span>
                            <span className="text-green-400">+${selectedPosition.earnings.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">APR</span>
                            <span className="text-white">{selectedPosition.apr.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">Price Center</span>
                            <span>${selectedPosition.priceCenter.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">Spread</span>
                            <span>${selectedPosition.spread}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">Volatility Bucket</span>
                            <span>{['Low', 'Medium', 'High', 'Extreme'][selectedPosition.volatilityBucket]}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">Fractal Depth</span>
                            <span>Level {selectedPosition.depth}</span>
                          </div>
                        </div>

                        {/* Recommendations based on health score */}
                        {selectedPosition.healthScore < 60 && (
                          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-yellow-500 font-medium">Recommendation</p>
                                <p className="text-xs text-gray-400">
                                  Consider adjusting spread or rebalancing to improve health score.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2.5 bg-white text-black rounded-xl text-sm font-medium"
                          >
                            Claim Fees
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                          >
                            Edit
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border border-white/10 rounded-2xl p-6 text-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <Target className="w-6 h-6 text-gray-500" />
                        </div>
                        <h3 className="font-medium mb-2">Select a Position</h3>
                        <p className="text-sm text-gray-500">
                          Click on a voxel in the 3D view to see position details
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Activity Feed */}
                  <div>
                    <span className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
                      Recent Activity
                    </span>
                    <div className="space-y-px bg-white/5 rounded-2xl overflow-hidden">
                      {activity.map((item, index) => (
                        <div
                          key={index}
                          className="bg-black p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-gray-600">{item.time}</p>
                          </div>
                          {item.amount && (
                            <span
                              className={`text-sm ${
                                item.amount.startsWith('+') ? 'text-green-400' : 'text-white'
                              }`}
                            >
                              {item.amount}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs tracking-widest uppercase text-gray-500">
                    All Positions ({positions.length})
                  </span>
                </div>

                <div className="space-y-px bg-white/5 rounded-2xl overflow-hidden">
                  {positions.map((position, index) => (
                    <motion.div
                      key={position.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedPosition(position)}
                      className={`bg-black p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                        selectedPosition?.id === position.id ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                          <span className="text-sm font-medium">
                            {position.pair.split('/')[0].charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{position.pair}</h3>
                            <EyeOff className="w-3 h-3 text-white" />
                            <HealthIndicator score={position.healthScore} />
                          </div>
                          <p className="text-sm text-gray-500">{position.type} Curve</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="font-medium">${position.liquidity.toLocaleString()}</p>
                          <p className="text-sm text-green-400 flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +${position.earnings.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{position.apr.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">APR</p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {positions.length === 0 && (
                  <div className="text-center py-16">
                    <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No positions yet</h3>
                    <p className="text-gray-500 mb-6">Create your first private liquidity position</p>
                    <Link href="/create">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-white text-black rounded-full text-sm font-medium"
                      >
                        Create Position
                      </motion.button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Full Position Modal (for mobile/list view) */}
      {selectedPosition && view === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedPosition(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="border border-white/10 rounded-3xl p-8 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                  <span className="text-lg font-medium">
                    {selectedPosition.pair.split('/')[0].charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-medium">{selectedPosition.pair}</h2>
                  <p className="text-sm text-gray-500">{selectedPosition.type} Curve</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPosition(null)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-gray-500">Position Value</span>
                <span className="font-medium">${selectedPosition.liquidity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-gray-500">Total Earnings</span>
                <span className="text-green-400">+${selectedPosition.earnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-gray-500">APR</span>
                <span className="text-white">{selectedPosition.apr.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-gray-500">Health Score</span>
                <HealthIndicator score={selectedPosition.healthScore} />
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Privacy Status</span>
                <span className="flex items-center gap-2 text-white">
                  <EyeOff className="w-4 h-4" />
                  Protected
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-white text-black rounded-xl font-medium"
              >
                Claim Fees
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 border border-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/5 transition-colors"
              >
                Close Position
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
