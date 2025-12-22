import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
}

export default function Logo({ size = 48, animated = true }: LogoProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <linearGradient id="voxelGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#666666" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="voxelGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#888888" stopOpacity="1" />
          <stop offset="100%" stopColor="#333333" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="voxelGradient3" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#555555" stopOpacity="1" />
          <stop offset="100%" stopColor="#111111" stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {animated && (
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#voxelGradient1)"
          strokeWidth="0.5"
          strokeOpacity="0.2"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
        />
      )}

      <g filter="url(#glow)">
        <motion.polygon
          points="50,15 80,32 80,58 50,75 20,58 20,32"
          fill="none"
          stroke="url(#voxelGradient1)"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        />

        <motion.line
          x1="50" y1="15"
          x2="50" y2="75"
          stroke="url(#voxelGradient2)"
          strokeWidth="1"
          strokeOpacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
        <motion.line
          x1="20" y1="32"
          x2="80" y2="58"
          stroke="url(#voxelGradient2)"
          strokeWidth="1"
          strokeOpacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        <motion.line
          x1="80" y1="32"
          x2="20" y2="58"
          stroke="url(#voxelGradient2)"
          strokeWidth="1"
          strokeOpacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />

        <motion.polygon
          points="50,35 62,42 62,55 50,62 38,55 38,42"
          fill="url(#voxelGradient1)"
          fillOpacity="0.9"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />

        <motion.polygon
          points="50,35 62,42 50,48 38,42"
          fill="white"
          fillOpacity="0.95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        />
        <motion.polygon
          points="38,42 50,48 50,62 38,55"
          fill="url(#voxelGradient2)"
          fillOpacity="0.8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        />
        <motion.polygon
          points="62,42 50,48 50,62 62,55"
          fill="url(#voxelGradient3)"
          fillOpacity="0.7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        />

        <motion.circle
          cx="50" cy="15"
          r="2"
          fill="white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.2 }}
        />
        <motion.circle
          cx="20" cy="32"
          r="1.5"
          fill="#888"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.2 }}
        />
        <motion.circle
          cx="80" cy="32"
          r="1.5"
          fill="#888"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.2 }}
        />
        <motion.circle
          cx="50" cy="75"
          r="1.5"
          fill="#666"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.2 }}
        />
        <motion.circle
          cx="20" cy="58"
          r="1.5"
          fill="#555"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.2 }}
        />
        <motion.circle
          cx="80" cy="58"
          r="1.5"
          fill="#555"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.2 }}
        />
      </g>

      <motion.text
        x="50"
        y="92"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="500"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        VOXEL
      </motion.text>
    </motion.svg>
  );
}

export function LogoMinimal({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#666666" />
        </linearGradient>
      </defs>
      <polygon
        points="50,10 85,30 85,70 50,90 15,70 15,30"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="2"
      />
      <polygon
        points="50,30 65,40 65,60 50,70 35,60 35,40"
        fill="white"
      />
      <polygon
        points="50,30 65,40 50,48 35,40"
        fill="white"
      />
      <polygon
        points="35,40 50,48 50,70 35,60"
        fill="#888"
      />
      <polygon
        points="65,40 50,48 50,70 65,60"
        fill="#444"
      />
    </svg>
  );
}

export function LogoFractal({ size = 48 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' as const }}
    >
      <defs>
        <linearGradient id="fractalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.line
          key={angle}
          x1="50"
          y1="50"
          x2={50 + 40 * Math.cos((angle * Math.PI) / 180)}
          y2={50 + 40 * Math.sin((angle * Math.PI) / 180)}
          stroke="url(#fractalGrad)"
          strokeWidth="1"
          strokeOpacity={0.3 + i * 0.1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        />
      ))}
      
      <motion.polygon
        points="50,20 70,35 70,55 50,70 30,55 30,35"
        fill="none"
        stroke="url(#fractalGrad)"
        strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
      
      <motion.polygon
        points="50,35 58,40 58,50 50,55 42,50 42,40"
        fill="url(#fractalGrad)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />
    </motion.svg>
  );
}
