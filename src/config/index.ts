export interface FractalType {
  id: number;
  name: string;
  description: string;
}

export const fractalTypes: FractalType[] = [
  { id: 0, name: 'Binary', description: 'Simple binary tree distribution' },
  { id: 1, name: 'Fibonacci', description: 'Golden ratio spacing' },
  { id: 2, name: 'Linear', description: 'Even distribution across range' },
  { id: 3, name: 'Exponential', description: 'Concentrated at center' },
  { id: 4, name: 'Cantor', description: 'Infinite recursive gaps' },
];

export const config = {
  // Movement Network Configuration
  movement: {
    rpc: 'https://testnet.movementnetwork.xyz/v1',
    chainId: 250,
    name: 'Movement Testnet',
    explorerUrl: 'https://explorer.movementnetwork.xyz',
  },

  // Contract Module Address - Update this after deployment
  moduleAddress: '0x1bb2b78e8e8d931a01789f0ab59e2a75f1eaa9838eeabb184a75a653f1c129da',

  // Token Addresses
  tokens: {
    weth: '0x1bb2b78e8e8d931a01789f0ab59e2a75f1eaa9838eeabb184a75a653f1c129da::weth::WETH',
    usdc: '0x1bb2b78e8e8d931a01789f0ab59e2a75f1eaa9838eeabb184a75a653f1c129da::usdc::USDC',
  },

  // Privy Configuration
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmj9qujlx066ok00cbeojq7id',
  },

  // Fee Configuration
  fees: {
    swapFeeBps: 30, // 0.3%
    lpFeeBps: 25, // 0.25% to LPs
    protocolFeeBps: 5, // 0.05% to protocol
  },

  // Fractal Types
  fractalTypes,
};
