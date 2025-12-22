import { motion } from 'framer-motion';
import Logo, { LogoMinimal, LogoFractal } from './Logo';

interface LogoShowcaseProps {
  setCurrentPage: (page: string) => void;
}

export default function LogoShowcase({ setCurrentPage }: LogoShowcaseProps) {
  return (
    <div className="min-h-screen bg-black pt-24 px-8 pb-12">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <span className="text-xs tracking-widest uppercase text-gray-500 mb-2 block">Brand</span>
          <h1 className="text-5xl font-light">Logo Design</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-20 mb-16 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent"
        >
          <Logo size={200} animated={true} />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-8 text-gray-500 text-sm"
          >
            Primary Logo - Animated Isometric Voxel
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/5"
          >
            <LogoMinimal size={80} />
            <p className="mt-6 text-gray-500 text-xs">Minimal</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/5"
          >
            <Logo size={80} animated={false} />
            <p className="mt-6 text-gray-500 text-xs">Static</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/5"
          >
            <LogoFractal size={80} />
            <p className="mt-6 text-gray-500 text-xs">Fractal Variant</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-light mb-8">Size Variations</h2>
          <div className="flex items-end gap-12 justify-center py-12 rounded-2xl border border-white/5">
            <div className="text-center">
              <LogoMinimal size={24} />
              <p className="mt-4 text-xs text-gray-600">24px</p>
            </div>
            <div className="text-center">
              <LogoMinimal size={32} />
              <p className="mt-4 text-xs text-gray-600">32px</p>
            </div>
            <div className="text-center">
              <LogoMinimal size={48} />
              <p className="mt-4 text-xs text-gray-600">48px</p>
            </div>
            <div className="text-center">
              <LogoMinimal size={64} />
              <p className="mt-4 text-xs text-gray-600">64px</p>
            </div>
            <div className="text-center">
              <LogoMinimal size={96} />
              <p className="mt-4 text-xs text-gray-600">96px</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-light mb-8">Design Concept</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border border-white/5">
              <h3 className="font-medium mb-4">Isometric 3D Voxel</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                The logo represents a single voxel (3D pixel) rendered in isometric perspective. 
                The outer hexagonal frame suggests the blockchain/crypto space while the inner 
                cube represents the core "voxel" concept - building blocks of the fractal liquidity system.
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-white/5">
              <h3 className="font-medium mb-4">Monochromatic Palette</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                The grayscale gradient creates depth and dimension while maintaining the minimalist 
                aesthetic. The white top face draws the eye upward, symbolizing growth and optimism.
                The subtle glow effect adds a premium, refined feel.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center gap-4"
        >
          <button
            onClick={() => setCurrentPage('Home')}
            className="px-6 py-3 rounded-full border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
