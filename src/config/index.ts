export const config = {
  privy: {
    appId: import.meta.env.VITE_PRIVY_APP_ID || '',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  },
  movement: {
    rpc: import.meta.env.VITE_MOVEMENT_RPC_URL || 'https://testnet.movementnetwork.xyz/v1',
    chainId: import.meta.env.VITE_MOVEMENT_CHAIN_ID || '250',
    moduleAddress: import.meta.env.VITE_MODULE_ADDRESS || '',
  },
  fractalTypes: {
    BINARY: 0,
    FIBONACCI: 1,
    LINEAR: 2,
    EXPONENTIAL: 3,
    CANTOR: 4,
  } as const,
};

export type FractalType = keyof typeof config.fractalTypes;

export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!config.privy.appId) missing.push('VITE_PRIVY_APP_ID');
  if (!config.movement.moduleAddress) missing.push('VITE_MODULE_ADDRESS');
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
