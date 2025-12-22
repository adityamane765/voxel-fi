import { motion } from 'framer-motion';
import { DollarSign, Percent, Clock, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, LineChart, Line } from 'recharts';

export default function Analytics() {
  const earningsData = [
    { date: 'Dec 16', earnings: 45 },
    { date: 'Dec 17', earnings: 82 },
    { date: 'Dec 18', earnings: 67 },
    { date: 'Dec 19', earnings: 124 },
    { date: 'Dec 20', earnings: 98 },
    { date: 'Dec 21', earnings: 156 },
    { date: 'Dec 22', earnings: 189 },
  ];

  const volumeData = [
    { pair: 'ETH/USDC', volume: 45000 },
    { pair: 'MOVE/USDC', volume: 32000 },
    { pair: 'BTC/USDC', volume: 28000 },
    { pair: 'SOL/USDC', volume: 18000 },
  ];

  const ilData = [
    { date: 'Week 1', il: -0.8, hedged: -0.2 },
    { date: 'Week 2', il: -1.2, hedged: -0.4 },
    { date: 'Week 3', il: -0.5, hedged: -0.1 },
    { date: 'Week 4', il: -1.8, hedged: -0.5 },
  ];

  const metrics = [
    { label: 'Total Fees', value: '$1,247', icon: DollarSign },
    { label: 'Avg APY', value: '24.8%', icon: Percent },
    { label: '7D Volume', value: '$123K', icon: BarChart3 },
    { label: 'Avg Hold', value: '18 days', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <span className="text-xs tracking-widest uppercase text-gray-500 mb-2 block">Performance</span>
          <h1 className="text-5xl font-light">Analytics</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden mb-12"
        >
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-black p-8">
              <metric.icon className="w-5 h-5 text-gray-500 mb-4" />
              <p className="text-2xl font-light mb-1">{metric.value}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">{metric.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border border-white/5"
          >
            <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Fee Earnings</span>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`$${value}`, 'Earnings']}
                  />
                  <Area type="monotone" dataKey="earnings" stroke="#fff" strokeWidth={1} fill="url(#earningsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl border border-white/5"
          >
            <span className="text-xs tracking-widest uppercase text-gray-500 mb-6 block">Volume by Pair</span>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} layout="vertical">
                  <XAxis type="number" stroke="#333" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}K`} />
                  <YAxis type="category" dataKey="pair" stroke="#333" fontSize={10} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#333" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl border border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs tracking-widest uppercase text-gray-500">Impermanent Loss</span>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500">Traditional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-xs text-gray-500">VoxelFi</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ilData}>
                <XAxis dataKey="date" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${value}%`]}
                />
                <Line type="monotone" dataKey="il" stroke="#ef4444" strokeWidth={1} dot={{ fill: '#ef4444', r: 3 }} />
                <Line type="monotone" dataKey="hedged" stroke="#fff" strokeWidth={1} dot={{ fill: '#fff', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
