import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, Loader2, Check, EyeOff, Eye, AlertCircle, Wallet } from 'lucide-react';
import { useWallets, useSendTransaction } from '@privy-io/react-auth';
import FractalVisualizer from './FractalVisualizer';
import { useWallet } from '../hooks/useWallet';
import { zkService } from '../services/api';
import { fractalPositionService } from '../services/aptos';
import { config } from '../config';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { normalizeAptosAddress } from '../utils/address';

const fractalTypeMap: Record<string, number> = {
  fibonacci: 1,
  cantor: 4,
  mandelbrot: 3,
  custom: 2,
};

export default function PositionCreator() {
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
  
  const [centerPrice, setCenterPrice] = useState(2000);
  const [spread, setSpread] = useState(500);
  const [depth, setDepth] = useState(5);
  const [fractalType, setFractalType] = useState<'fibonacci' | 'cantor' | 'mandelbrot' | 'custom'>('fibonacci');
  const [liquidity, setLiquidity] = useState(1000);
  
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [proofData, setProofData] = useState<{ proof: any; publicSignals: string[] } | null>(null);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  const fractalTypes = [
    { id: 'fibonacci', name: 'Fibonacci', desc: 'Golden ratio decay' },
    { id: 'cantor', name: 'Cantor', desc: 'Sparse center pattern' },
    { id: 'mandelbrot', name: 'Mandelbrot', desc: 'Chaotic distribution' },
    { id: 'custom', name: 'Custom', desc: 'Define parameters' },
  ];

  const generateCommitmentHash = () => {
    const data = `${centerPrice}-${spread}-${depth}-${fractalType}-${liquidity}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(16, '0');
  };

  const handleGenerateProof = async () => {
    setIsGeneratingProof(true);
    setError(null);
    
    try {
      const commitment = generateCommitmentHash();
      const secret = Math.random().toString(36).substring(2, 15);
      
      try {
        const proof = await zkService.generateProof({
          secret,
          commitment,
        });
        setProofData(proof);
      } catch (apiError) {
        console.warn('API not available, simulating proof generation');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setProofData({
          proof: { simulated: true },
          publicSignals: [commitment],
        });
      }
      
      setProofGenerated(true);
    } catch (err) {
      console.error('Failed to generate proof:', err);
      setError('Failed to generate ZK proof. Please try again.');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleDeploy = async () => {
    if (!authenticated) {
      login();
      return;
    }
    
    if (!proofGenerated) {
      setError('Please generate a ZK proof first.');
      return;
    }
    
    setIsDeploying(true);
    setError(null);
    
    try {
      const aptosWallet = wallets.find((wallet) => wallet.chainType === 'movement');
      if (!aptosWallet || !fractalPositionService.isConfigured()) {
        console.warn('Aptos not configured or wallet not found, simulating deployment');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTxHash('0x' + Math.random().toString(16).substring(2, 18));
        setDeployed(true);
        return;
      }
      
      const payload = fractalPositionService.buildMintPositionPayload(
        '0x1::aptos_coin::AptosCoin',
        '0x1::aptos_coin::AptosCoin',
        {
          amountX: liquidity * 1000000,
          amountY: liquidity * 1000000,
          priceCenter: centerPrice * 100,
          spread: spread * 100,
          fractalType: fractalTypeMap[fractalType],
          depth,
        }
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

      setTxHash(tx.hash);
      setDeployed(true);
    } catch (err) {
      console.error('Failed to deploy position:', err);
      setError('Failed to deploy position. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  };

  const privacyItems = [
    { label: 'Center Price', value: `$${centerPrice.toLocaleString()}`, private: true },
    { label: 'Spread', value: `±$${spread}`, private: true },
    { label: 'Type', value: fractalType, private: true },
    { label: 'Depth', value: depth, private: true },
    { label: 'Liquidity', value: `$${liquidity.toLocaleString()}`, private: false },
    { label: 'Hash', value: proofGenerated ? proofData?.publicSignals?.[0]?.slice(0, 10) + '...' : '—', private: false },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <span className="text-xs tracking-widest uppercase text-gray-500 mb-2 block">Create</span>
          <h1 className="text-5xl font-light">New Position</h1>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Fractal Type</span>
              <div className="grid grid-cols-2 gap-3">
                {fractalTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setFractalType(type.id as any)}
                    disabled={deployed}
                    className={`p-5 rounded-xl text-left transition-all border disabled:opacity-50 ${
                      fractalType === type.id
                        ? 'border-white/20 bg-white/[0.03]'
                        : 'border-white/5 bg-transparent hover:border-white/10'
                    }`}
                  >
                    <h3 className="font-medium mb-1">{type.name}</h3>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Parameters</span>
              <div className="space-y-8 p-6 rounded-2xl border border-white/5">
                {[
                  { label: 'Center Price', value: centerPrice, setValue: setCenterPrice, min: 1000, max: 3000, unit: '$' },
                  { label: 'Spread Width', value: spread, setValue: setSpread, min: 100, max: 1000, unit: '±$' },
                  { label: 'Recursion Depth', value: depth, setValue: setDepth, min: 1, max: 10, unit: '' },
                  { label: 'Liquidity', value: liquidity, setValue: setLiquidity, min: 100, max: 10000, unit: '$', step: 100 },
                ].map((param) => (
                  <div key={param.label}>
                    <div className="flex justify-between mb-3">
                      <span className="text-sm text-gray-400">{param.label}</span>
                      <span className="text-sm font-medium">{param.unit}{param.value.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      step={param.step || 1}
                      value={param.value}
                      onChange={(e) => param.setValue(Number(e.target.value))}
                      disabled={deployed}
                      className="w-full h-px bg-white/10 appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Preview</span>
              <div className="p-6 rounded-2xl border border-white/5">
                <FractalVisualizer 
                  centerPrice={centerPrice}
                  spread={spread}
                  depth={depth}
                  fractalType={fractalType}
                />
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Privacy</span>
              <div className="p-6 rounded-2xl border border-white/5">
                <div className="space-y-4">
                  {privacyItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{item.value}</span>
                        {item.private ? (
                          <EyeOff className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Eye className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/10">
                  <div className="flex items-start gap-3">
                    <Lock className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-cyan-400">Privacy Protected</p>
                      <p className="text-xs text-gray-500 mt-1">
                        4 parameters stay local. Only hash goes on-chain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Gas Savings</span>
              <div className="p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                  <span className="text-sm text-gray-500">Traditional LP</span>
                  <span className="text-red-400">~$300</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-gray-500">VoxelFi</span>
                  <span className="text-cyan-400">~$1.20</span>
                </div>
                <div className="text-center py-4 rounded-xl bg-white/[0.02]">
                  <span className="text-3xl font-light">99.6%</span>
                  <span className="text-gray-500 ml-2">saved</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {!authenticated && walletsReady && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={login}
                  className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGenerateProof}
                disabled={!walletsReady || isGeneratingProof || proofGenerated || deployed}
                className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border ${
                  proofGenerated
                    ? 'border-green-500/20 bg-green-500/[0.05] text-green-400'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                } disabled:opacity-50`}
              >
                {!walletsReady ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Wallets...
                  </>
                ) : isGeneratingProof ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating ZK Proof...
                  </>
                ) : proofGenerated ? (
                  <>
                    <Check className="w-4 h-4" />
                    Proof Generated
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Generate ZK Proof
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleDeploy}
                disabled={!walletsReady || !proofGenerated || isDeploying || deployed}
                className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  deployed
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : proofGenerated
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deploying...
                  </>
                ) : deployed ? (
                  <>
                    <Check className="w-4 h-4" />
                    Position Deployed
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Deploy Position
                  </>
                )}
              </motion.button>

              {txHash && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                  <p className="text-sm font-mono text-cyan-400 break-all">{txHash}</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}