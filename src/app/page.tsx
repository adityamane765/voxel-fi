'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Shield, Zap, Layers, Lock, FileCheck, Rocket, Play, Clock } from 'lucide-react';
import { OnboardingFlow } from '@/components/OnboardingFlow';

const VoxelScene = dynamic(() => import('@/components/VoxelScene'), {
  ssr: false,
  loading: () => null,
});

// Animated counter
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const features = [
  {
    icon: Shield,
    title: 'Zero-Knowledge Privacy',
    desc: 'Your liquidity strategy is cryptographically hidden. MEV bots and competitors see only commitments.',
  },
  {
    icon: Zap,
    title: 'Fractal Mathematics',
    desc: 'Self-similar curves provide infinite price coverage with logarithmic storage.',
  },
  {
    icon: Layers,
    title: 'Spatial Indexing',
    desc: '3D octree structure enables O(1) liquidity lookups across all positions.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Design Your Fractal',
    desc: 'Choose from Binary, Fibonacci, Linear, Exponential, or Cantor distributions.',
    icon: Lock,
  },
  {
    num: '02',
    title: 'Generate ZK Proof',
    desc: 'Poseidon hash creates commitment. Groth16 validates without revealing.',
    icon: FileCheck,
  },
  {
    num: '03',
    title: 'Earn Privately',
    desc: 'Position NFT minted. Fees accrue via global accumulator. Claim anytime.',
    icon: Rocket,
  },
];

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 60-Second Demo Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          // Navigate to create page after onboarding
          window.location.href = '/create';
        }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded" />
            <span className="font-semibold">VoxelFi</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it works</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</a>
            <Link href="/create">
              <button className="text-sm px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Launch App
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-sm text-gray-500 uppercase tracking-widest mb-6"
              >
                Built on Movement Network
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] mb-6"
              >
                Private Fractal Liquidity
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-gray-400 mb-10 max-w-md"
              >
                Zero-knowledge proofs meet fractal mathematics. Your strategy stays private. Your yields stay high.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-4 mb-16"
              >
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4" />
                  60s Demo
                  <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">Privy</span>
                </button>
                <Link href="/create">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Launch App
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <a href="#how-it-works">
                  <button className="px-6 py-3 border border-white/20 rounded-lg font-medium hover:bg-white/5 transition-colors">
                    Learn More
                  </button>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-3 gap-8"
              >
                <div>
                  <div className="text-3xl font-semibold"><Counter value={100} suffix="x" /></div>
                  <div className="text-sm text-gray-500">Gas Savings</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold"><Counter value={256} /> <span className="text-lg text-gray-500">bytes</span></div>
                  <div className="text-sm text-gray-500">Position Size</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold">0</div>
                  <div className="text-sm text-gray-500">Data Leaked</div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block h-[500px]"
            >
              <VoxelScene />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">Core Technology</p>
            <h2 className="text-3xl md:text-4xl font-semibold">DeFi, reimagined</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">Process</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Three steps to private liquidity</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-white/5 mb-4">{step.num}</div>
                <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-32 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold mb-4">
              <Counter value={100} suffix="x" /> cheaper
            </h2>
            <p className="text-gray-400">Fractal compression vs traditional range positions</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 border border-white/10 rounded-xl"
            >
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Traditional AMM</p>
              <div className="space-y-2 mb-6 font-mono text-sm text-gray-600">
                <div>Position 1: |----| 200K gas</div>
                <div>Position 2: |----| 200K gas</div>
                <div>Position 3: |----| 200K gas</div>
                <div>... 97 more positions</div>
              </div>
              <div className="text-3xl font-semibold text-gray-400">~$300</div>
              <div className="text-sm text-gray-600">100 positions on Ethereum</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 border border-white/20 rounded-xl bg-white/[0.02]"
            >
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">VoxelFi</p>
              <div className="space-y-2 mb-6 font-mono text-sm text-gray-400">
                <div>..##@@##@@##..</div>
                <div>Infinite fractal depth</div>
                <div>256 bytes total</div>
              </div>
              <div className="text-3xl font-semibold">~$1.20</div>
              <div className="text-sm text-gray-500">∞ positions on Movement</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-semibold mb-6">Ready to go private?</h2>
            <p className="text-gray-400 mb-10 max-w-lg mx-auto">
              Join the future of DeFi where your strategies stay yours. No more front-running. No more copycat traders.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowOnboarding(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                <Clock className="w-5 h-5" />
                Try in 60 Seconds
              </button>
              <Link href="/create">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded" />
            <span className="text-sm font-medium">VoxelFi</span>
          </div>
          <div className="text-sm text-gray-600">Built for Movement Network</div>
          <div className="flex gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors">GitHub</a>
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Docs</a>
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
