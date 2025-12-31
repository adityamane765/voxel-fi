'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const phrases = [
  'Zero-Knowledge Proofs',
  'Fractal Liquidity Curves',
  'Movement Network',
  'Private Strategies',
  'MEV Protection',
];

export default function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-gradient-rotate inline-block relative h-[1.2em]">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="gradient-text-accent absolute left-0"
        >
          {phrases[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
