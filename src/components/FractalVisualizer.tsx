import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface FractalVisualizerProps {
  centerPrice?: number;
  spread?: number;
  depth?: number;
  fractalType?: 'fibonacci' | 'cantor' | 'mandelbrot' | 'custom';
}

export default function FractalVisualizer({ 
  centerPrice = 2000, 
  spread = 500, 
  depth = 5,
  fractalType = 'fibonacci' 
}: FractalVisualizerProps) {
  const [animatedData, setAnimatedData] = useState<{ price: number; liquidity: number }[]>([]);

  useEffect(() => {
    const generateFractalCurve = () => {
      const points: { price: number; liquidity: number }[] = [];
      const minPrice = centerPrice - spread;
      const maxPrice = centerPrice + spread;
      const step = (maxPrice - minPrice) / 100;

      for (let price = minPrice; price <= maxPrice; price += step) {
        let liquidity = 0;
        const normalizedDist = Math.abs(price - centerPrice) / spread;

        switch (fractalType) {
          case 'fibonacci':
            liquidity = Math.exp(-normalizedDist * 2) * Math.pow(0.618, depth * normalizedDist);
            break;
          case 'cantor':
            const cantorFactor = Math.sin(normalizedDist * Math.PI * depth) * 0.5 + 0.5;
            liquidity = (1 - normalizedDist) * cantorFactor;
            break;
          case 'mandelbrot':
            const chaotic = Math.sin(normalizedDist * 10) * Math.cos(normalizedDist * 7);
            liquidity = Math.max(0, (1 - normalizedDist * 0.8) + chaotic * 0.2);
            break;
          default:
            liquidity = Math.exp(-normalizedDist * 3);
        }

        points.push({ price: Math.round(price), liquidity: Math.max(0, liquidity * 100) });
      }
      return points;
    };

    const newData = generateFractalCurve();
    setAnimatedData(newData.map(d => ({ ...d, liquidity: 0 })));
    setTimeout(() => setAnimatedData(newData), 100);
  }, [centerPrice, spread, depth, fractalType]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">
            {fractalType.charAt(0).toUpperCase() + fractalType.slice(1)} Distribution
          </p>
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>${centerPrice - spread}</span>
          <span className="text-white">${centerPrice}</span>
          <span>${centerPrice + spread}</span>
        </div>
      </div>
      
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={animatedData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="price" 
              stroke="#333" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelFormatter={(value) => `$${value}`}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Liquidity']}
            />
            <Area
              type="monotone"
              dataKey="liquidity"
              stroke="#fff"
              strokeWidth={1}
              fill="url(#liquidityGradient)"
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
