'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface LiquidityChartProps {
  priceCenter: number;
  spread: number;
  depth: number;
  fractalType: 'Binary' | 'Fibonacci' | 'Linear' | 'Exponential' | 'Cantor' | string;
}

export default function LiquidityChart({
  priceCenter,
  spread,
  depth,
  fractalType,
}: LiquidityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Generate liquidity distribution points based on fractal type
  const { points, priceLabels } = useMemo(() => {
    const numPoints = 200;
    const minPrice = priceCenter - spread;
    const maxPrice = priceCenter + spread;
    const priceRange = maxPrice - minPrice;

    const pts: { x: number; y: number; price: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      const price = minPrice + x * priceRange;
      let liquidity = 0;

      const normalizedPos = (price - priceCenter) / spread;

      switch (fractalType) {
        case 'Binary': {
          const peak1 = Math.exp(-Math.pow((normalizedPos + 0.5) * (1 + depth), 2) * 2);
          const peak2 = Math.exp(-Math.pow((normalizedPos - 0.5) * (1 + depth), 2) * 2);
          liquidity = (peak1 + peak2) / 2;
          break;
        }
        case 'Fibonacci': {
          const phi = 1.618;
          const fib = [1, 1, 2, 3, 5, 8, 13, 21];
          let sum = 0;
          for (let d = 0; d < Math.min(depth + 2, fib.length); d++) {
            const offset = (d - depth / 2) * 0.3 / phi;
            sum += fib[d] * Math.exp(-Math.pow((normalizedPos - offset) * 3, 2));
          }
          liquidity = sum / (fib[depth + 1] || 8);
          break;
        }
        case 'Linear': {
          const flatness = 0.8 + depth * 0.05;
          liquidity = Math.max(0, 1 - Math.pow(Math.abs(normalizedPos), 2 / flatness));
          break;
        }
        case 'Exponential': {
          const concentration = 1 + depth * 0.8;
          liquidity = Math.exp(-Math.pow(normalizedPos * concentration, 2) * 2);
          break;
        }
        case 'Cantor': {
          const gapCheck = (pos: number, level: number): boolean => {
            if (level <= 0) return false;
            const third = 1 / 3;
            const absPos = Math.abs(pos);
            if (absPos > third && absPos < 2 * third) return true;
            if (absPos <= third) return gapCheck(pos * 3, level - 1);
            if (absPos >= 2 * third) return gapCheck((pos - (pos > 0 ? 2 * third : -2 * third)) * 3, level - 1);
            return false;
          };
          const inGap = gapCheck(normalizedPos, depth);
          liquidity = inGap ? 0.1 : 0.8 + Math.random() * 0.2;
          break;
        }
        default:
          liquidity = Math.exp(-Math.pow(normalizedPos, 2) * 2);
      }

      pts.push({ x, y: Math.max(0, Math.min(1, liquidity)), price });
    }

    const labels = [
      { value: minPrice, position: 0 },
      { value: priceCenter, position: 50 },
      { value: maxPrice, position: 100 },
    ];

    return { points: pts, priceLabels: labels };
  }, [priceCenter, spread, depth, fractalType]);

  // Generate SVG paths
  const { fillPath, linePath } = useMemo(() => {
    if (points.length === 0) return { fillPath: '', linePath: '' };

    const width = 100;
    const height = 100;

    let fill = `M 0 ${height}`;
    fill += ` L 0 ${height - points[0].y * height}`;
    points.forEach((pt) => {
      fill += ` L ${pt.x * width} ${height - pt.y * height}`;
    });
    fill += ` L ${width} ${height} Z`;

    let line = `M 0 ${height - points[0].y * height}`;
    points.forEach((pt) => {
      line += ` L ${pt.x * width} ${height - pt.y * height}`;
    });

    return { fillPath: fill, linePath: line };
  }, [points]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 10));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(10, z * delta)));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse leave
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Reset View"
          >
            <Move className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-xs text-gray-600 ml-2">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="text-xs text-gray-500">
          Scroll to zoom, drag to pan
        </div>
      </div>

      {/* Interactive Chart Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grid */}
            <defs>
              <pattern id="chartGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="0.3"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#chartGrid)" />

            {/* Center line */}
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.3"
              strokeDasharray="1,1"
            />

            {/* Horizontal lines */}
            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="0.2"
              />
            ))}

            {/* Filled area */}
            <path
              d={fillPath}
              fill="rgba(255,255,255,0.04)"
            />

            {/* Main line */}
            <path
              d={linePath}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="0.6"
            />

            {/* Data points at key positions */}
            {points.filter((_, i) => i % 20 === 0 || i === points.length - 1).map((pt, i) => (
              <circle
                key={i}
                cx={pt.x * 100}
                cy={100 - pt.y * 100}
                r="0.8"
                fill="white"
                opacity="0.6"
              />
            ))}
          </svg>
        </div>

        {/* Y-axis label */}
        <div className="absolute left-2 top-2 text-[10px] text-gray-500 pointer-events-none">
          Liquidity
        </div>

        {/* Current price marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none"
          style={{ left: '50%', transform: `translateX(${pan.x}px) scaleX(${1/zoom})` }}
        />
      </div>

      {/* X-axis labels */}
      <div className="h-6 flex justify-between items-center px-1 text-xs text-gray-500 mt-2">
        {priceLabels.map((label, i) => (
          <div key={i} className={i === 1 ? 'text-white font-medium' : ''}>
            ${label.value.toLocaleString()}
          </div>
        ))}
      </div>

      {/* Info bar */}
      <div className="flex justify-between text-xs text-gray-600 px-1">
        <span>{fractalType} Distribution</span>
        <span>Depth: {depth}</span>
      </div>
    </div>
  );
}
