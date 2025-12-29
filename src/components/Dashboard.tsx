import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, EyeOff, Plus, ArrowUpRight, Loader2, Wallet, AlertCircle, X } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useWallets, useSendTransaction } from '@privy-io/react-auth';
import { positionService } from '../services/api';
import { fractalPositionService } from '../services/aptos';
import { config } from '../config';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { normalizeAptosAddress } from '../utils/address';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

interface PositionDisplay {
  id: number;
  pair: string;
  type: string;
  value: string;
  earnings: string;
  liquidity: number;
}

const fractalTypeNames: Record<number, string> = {
  0: 'Binary',
  1: 'Fibonacci',
  2: 'Linear',
  3: 'Exponential',
  4: 'Cantor',
};

export default function Dashboard({ setCurrentPage }: DashboardProps) {
  const aptos = useMemo(() => {
    const aptosConfig = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: config.movement.rpc,
    });
    return new Aptos(aptosConfig);
  }, []);

  const { authenticated, login } = useWallet();
  const { wallets, ready: walletsReady } = useWallets();
  const { sendTransaction } = useSendTransaction();

  const aptosWallet = useMemo(() => wallets.find((wallet) => wallet.chainType === 'movement'), [wallets]);

  const [positions, setPositions] = useState<PositionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closingPositionId, setClosingPositionId] = useState<number | null>(null);

  const mockPositions: PositionDisplay[] = [
    { id: 1, pair: 'ETH/USDC', type: 'Fibonacci', value: '$8,500', earnings: '+3.67%', liquidity: 8500 },
    { id: 2, pair: 'MOVE/USDC', type: 'Cantor', value: '$6,200', earnings: '+7.89%', liquidity: 6200 },
    { id: 3, pair: 'BTC/USDC', type: 'Mandelbrot', value: '$10,192', earnings: '+4.37%', liquidity: 10192 },
  ];

  const stats = positions.length > 0 ? [
    { label: 'Total Value', value: `$${positions.reduce((sum, p) => sum + p.liquidity, 0).toLocaleString()}` },
    { label: 'Earnings', value: '+$1,247.32', positive: true },
    { label: 'Positions', value: String(positions.length) },
    { label: 'Privacy', value: 'Protected', icon: EyeOff },
  ] : [
    { label: 'Total Value', value: '$0' },
    { label: 'Earnings', value: '$0', positive: false },
    { label: 'Positions', value: '0' },
    { label: 'Privacy', value: 'Protected', icon: EyeOff },
  ];

  const activity = [
    { action: 'Fees collected', amount: '+$12.45', time: '2m ago' },
    { action: 'Position opened', amount: '$5,000', time: '1h ago' },
    { action: 'ZK Proof verified', amount: '', time: '5h ago' },
  ];

  useEffect(() => {
    if (walletsReady) {
      if (authenticated && aptosWallet) {
        fetchPositions(aptosWallet.address);
      } else {
        setLoading(false);
        setPositions(mockPositions);
      }
    }
  }, [authenticated, aptosWallet, walletsReady]);

  async function fetchPositions(walletAddress: string) {
    if (!walletAddress) {
      setPositions(mockPositions);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPositions: PositionDisplay[] = [];
      
      for (let i = 0; i < 10; i++) { // Limit to checking 10 position IDs for now
        const positionResult = await fractalPositionService.getPosition(walletAddress, i);
        
        if (positionResult) {
          const position = {
            id: positionResult.id,
            pair: 'MOVE/USDC',
            type: fractalTypeNames[positionResult.fractalType] || 'Unknown',
            value: `$${positionResult.liquidityFormatted.toLocaleString()}`,
            earnings: '+0.00%',
            liquidity: positionResult.liquidityFormatted,
          };
          fetchedPositions.push(position);
        } else {
          // If we get a null result, it means the resource is missing or 
          // we've hit an ID that doesn't exist in the table. We can stop.
          break;
        }
      }
      
      setPositions(fetchedPositions.length > 0 ? fetchedPositions : mockPositions);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
      setError('Failed to load positions. Showing demo data.');
      setPositions(mockPositions);
    } finally {
      setLoading(false);
    }
  }

  async function handleClosePosition(positionId: number) {
    if (!authenticated || !aptosWallet) {
      login();
      return;
    }

    setClosingPositionId(positionId);
    setError(null);

    try {
      if (!fractalPositionService.isConfigured()) {
        throw new Error('Module not configured.');
      }

      const payload = fractalPositionService.buildBurnPositionPayload(
        '0x1::aptos_coin::AptosCoin',
        '0x1::aptos_coin::AptosCoin',
        positionId
      );

      const senderAddress = normalizeAptosAddress(aptosWallet.address);

      const transaction = {
        data: payload
      };
      
      console.log('Transaction:', transaction);

      const tx = await sendTransaction(
        {
          to: payload.function.split('::')[0],
          data: transaction as any,
          value: '0',
        },
        {
          address: senderAddress,
        }
      );

      await aptos.waitForTransaction({ transactionHash: tx.hash });
      
      console.log('Close position tx hash:', tx.hash);
      // Refetch positions after a delay to allow the transaction to be indexed
      setTimeout(() => fetchPositions(aptosWallet.address), 3000);

    } catch (err) {
      console.error('Failed to close position:', err);
      setError('Failed to close position. Please try again.');
    } finally {
      setClosingPositionId(null);
    }
  }

  const displayPositions = positions.length > 0 ? positions : mockPositions;

  return (
    <div className="min-h-screen bg-black pt-24 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between mb-16"
        >
          <div>
            <span className="text-xs tracking-widest uppercase text-gray-500 mb-2 block">Overview</span>
            <h1 className="text-5xl font-light">Dashboard</h1>
            {displayPositions === mockPositions && !loading && (
              <p className="text-xs text-gray-600 mt-2">Showing demo data</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!authenticated && walletsReady && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={login}
                className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-full text-sm hover:bg-white/5 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage('Create Position')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Position
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-sm text-yellow-500">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden mb-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-black p-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{stat.label}</p>
              <div className="flex items-center gap-2">
                {stat.icon && <stat.icon className="w-5 h-5 text-cyan-400" />}
                <p className={`text-2xl font-light ${stat.positive ? 'text-green-400' : 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs tracking-widest uppercase text-gray-500">Positions</span>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
              </div>
              <div className="space-y-px bg-white/5 rounded-2xl overflow-hidden">
                {displayPositions.map((position, index) => (
                  <motion.div
                    key={position.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-black p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{position.pair.split('/')[0].charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{position.pair}</h3>
                          <EyeOff className="w-3 h-3 text-cyan-400" />
                        </div>
                        <p className="text-sm text-gray-500">{position.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="font-medium">{position.value}</p>
                        <p className="text-sm text-green-400 flex items-center justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {position.earnings}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => handleClosePosition(position.id)}
                        disabled={closingPositionId === position.id}
                        className="p-2 rounded-full hover:bg-red-500/10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {closingPositionId === position.id ? (
                          <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </motion.button>
                      <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Activity</span>
            <div className="space-y-px bg-white/5 rounded-2xl overflow-hidden">
              {activity.map((item, index) => (
                <div key={index} className="bg-black p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-gray-600">{item.time}</p>
                  </div>
                  {item.amount && (
                    <span className={`text-sm ${item.amount.startsWith('+') ? 'text-green-400' : 'text-white'}`}>
                      {item.amount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}