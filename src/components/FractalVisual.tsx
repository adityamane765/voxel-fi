import { motion } from 'framer-motion';

export default function FractalVisual() {
  const layers = [
    { scale: 1, delay: 0, opacity: 0.15 },
    { scale: 0.7, delay: 0.2, opacity: 0.25 },
    { scale: 0.45, delay: 0.4, opacity: 0.4 },
    { scale: 0.25, delay: 0.6, opacity: 0.6 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {layers.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ 
            opacity: layer.opacity, 
            scale: layer.scale,
            rotate: i % 2 === 0 ? 360 : -360
          }}
          transition={{ 
            opacity: { delay: layer.delay, duration: 1 },
            scale: { delay: layer.delay, duration: 1, ease: 'easeOut' },
            rotate: { duration: 60 + i * 20, repeat: Infinity, ease: 'linear' }
          }}
        >
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="200,40 340,120 340,280 200,360 60,280 60,120"
              fill="none"
              stroke="url(#fractalGradient)"
              strokeWidth="1"
            />
            <line x1="200" y1="40" x2="200" y2="360" stroke="url(#fractalGradient)" strokeWidth="0.5" strokeOpacity="0.5" />
            <line x1="60" y1="120" x2="340" y2="280" stroke="url(#fractalGradient)" strokeWidth="0.5" strokeOpacity="0.3" />
            <line x1="340" y1="120" x2="60" y2="280" stroke="url(#fractalGradient)" strokeWidth="0.5" strokeOpacity="0.3" />
            <defs>
              <linearGradient id="fractalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      ))}
      
      <motion.div
        className="absolute"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <motion.div
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(6, 182, 212, 0.2)',
              '0 0 60px rgba(6, 182, 212, 0.4)',
              '0 0 20px rgba(6, 182, 212, 0.2)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const radius = 120;
          const x = 200 + radius * Math.cos(angle);
          const y = 200 + radius * Math.sin(angle);
          return (
            <motion.div
              key={`node-${i}`}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{ left: x - 4, top: y - 4 }}
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.3,
                ease: 'easeInOut'
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
