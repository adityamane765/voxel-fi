import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Layers, Lock, FileCheck, Rocket } from 'lucide-react';
import RotatingText from './RotatingText';
import FractalVisual from './FractalVisual';

interface LandingPageProps {
  setCurrentPage: (page: string) => void;
}

export default function LandingPage({ setCurrentPage }: LandingPageProps) {
  const features = [
    'Zero-Knowledge Proofs', 
    'Fractal Liquidity Curves',
    'Movement Network',
    'Privacy Preserving',
  ];

  const whyCards = [
    { 
      icon: Shield, 
      title: 'Privacy First', 
      desc: 'Your strategy stays hidden from MEV bots and competitors' 
    },
    { 
      icon: Zap, 
      title: 'Gas Efficient', 
      desc: '100x savings through fractal mathematics' 
    },
    { 
      icon: Layers, 
      title: 'Infinite Coverage', 
      desc: 'One position covers all price ranges' 
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Define Your Curve',
      desc: 'Choose fractal parameters that shape your liquidity distribution. Your settings never leave your device.',
      icon: Lock,
    },
    {
      step: '02',
      title: 'Generate ZK Proof',
      desc: 'A cryptographic commitment proves your position is valid without revealing the actual parameters.',
      icon: FileCheck,
    },
    {
      step: '03',
      title: 'Deploy & Earn',
      desc: 'Your private liquidity goes live on Movement Network. Collect fees while staying protected.',
      icon: Rocket,
    },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 fractal-bg" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl animate-parallax" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/[0.01] rounded-full blur-3xl animate-parallax-reverse" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/[0.02] rounded-full blur-3xl animate-pulse-slow" />

      <section className="relative min-h-screen flex flex-col justify-center px-8">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.9] mb-8">
                <span className="block text-white">Private</span>
                <span className="block text-white">Fractal</span>
                <span className="block text-gray-600">Liquidity.</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mb-10"
            >
              <div className="text-2xl md:text-3xl font-light">
                <RotatingText />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage('Create Position')}
                className="btn-glow group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-medium text-sm"
              >
                Launch App
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary-glow btn-minimal px-8 py-4 rounded-full text-sm"
              >
                How It Works
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="flex flex-wrap gap-x-8 gap-y-3"
            >
              {features.map((feature, index) => (
                <motion.span
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                  className="text-sm text-gray-500 flex items-center gap-3"
                >
                  <span className="w-1 h-1 bg-cyan-500 rounded-full" />
                  {feature}
                </motion.span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="hidden lg:flex items-center justify-center h-[500px]"
          >
            <FractalVisual />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent"
            />
          </div>
        </motion.div>
      </section>

      <section className="relative py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">Why VoxelFi</span>
            <h2 className="text-3xl md:text-4xl font-light">
              Built different.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="why-card p-8 rounded-2xl text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-6">
                  <card.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-medium mb-3">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-light">
              Three steps to <span className="gradient-text-accent">private liquidity</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%_+_40px)] w-[calc(100%_-_40px)] h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <div className="text-center">
                  <div className="step-number mx-auto mb-6">{item.step}</div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 mb-4">
                    <item.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div>
              <span className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">The Problem</span>
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                DeFi liquidity is<br />
                <span className="text-gray-500">public by default.</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Every LP reveals their center price, range boundaries, and liquidity depth. 
                Sandwich bots, front-runners, and copycat traders feast on your transparent strategy.
              </p>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Center price', status: 'exposed', desc: 'Competitors copy your positioning' },
                { label: 'Range boundaries', status: 'exposed', desc: 'Bots exploit your limits' },
                { label: 'Liquidity depth', status: 'exposed', desc: 'Reveals your capital allocation' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-between py-4 border-b border-white/5"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="space-y-6 order-2 md:order-1">
              {[
                { label: 'Parameters', status: 'private', desc: 'Stay local, never touch blockchain' },
                { label: 'Strategy', status: 'private', desc: 'Only cryptographic commitments on-chain' },
                { label: 'Execution', status: 'verified', desc: 'ZK proofs verify without revealing' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-between py-4 border-b border-white/5"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    item.status === 'private' 
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-green-500/10 text-green-400 border border-green-500/20'
                  }`}>
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="order-1 md:order-2">
              <span className="text-xs tracking-widest uppercase text-gray-500 mb-4 block">The Solution</span>
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                VoxelFi flips<br />
                <span className="gradient-text-accent">the script.</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Your parameters stay local. Only cryptographic commitments stored on-chain. 
                ZK proofs verify validity without revealing strategy. Attackers see liquidity exists, not how it&apos;s structured.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-32 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-light mb-4">
              100x gas savings.
            </h2>
            <p className="text-gray-500 text-lg">
              Fractal mathematics provides infinite price coverage in one transaction.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 rounded-2xl border border-red-500/10 bg-red-500/[0.02]"
            >
              <span className="text-xs tracking-widest uppercase text-red-400 mb-4 block">Traditional</span>
              <div className="font-mono text-sm text-gray-400 space-y-1 mb-6">
                <div>Position 1: |████| (200K gas)</div>
                <div>Position 2: |████| (200K gas)</div>
                <div>Position 3: |████| (200K gas)</div>
                <div className="text-gray-600">... 97 more positions</div>
              </div>
              <div className="text-3xl font-light text-red-400">~$300</div>
              <div className="text-sm text-gray-600">100 positions on Ethereum</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.02]"
            >
              <span className="text-xs tracking-widest uppercase text-cyan-400 mb-4 block">VoxelFi</span>
              <div className="font-mono text-sm text-gray-400 space-y-1 mb-6">
                <div>░░▒▒▓▓████▓▓▒▒░░</div>
                <div className="text-gray-600">Infinite ranges</div>
                <div className="text-gray-600">One transaction</div>
                <div className="text-gray-600">256 bytes</div>
              </div>
              <div className="text-3xl font-light text-cyan-400">~$1.20</div>
              <div className="text-sm text-gray-600">Infinite positions on Movement</div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="relative py-16 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm text-gray-600">
            Built for Movement Network
          </div>
          <div className="flex gap-8">
            <a href="https://github.com/adityamane765/voxel-fi" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
              Docs
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
