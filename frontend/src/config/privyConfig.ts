import type { PrivyClientConfig } from '@privy-io/react-auth';

// Privy App ID - Get from https://dashboard.privy.io/
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'your-privy-app-id';

export const privyConfig: PrivyClientConfig = {
  
  // Configure embedded wallets
  embeddedWallets: {
    createOnLogin: 'all-users', // Automatically create embedded wallet for all users
    requireUserPasswordOnCreate: false, // No password needed - seamless UX
  },

  // Appearance customization
  appearance: {
    theme: 'dark',
    accentColor: '#6366F1',
    logo: 'https://your-logo-url.com/logo.png',
  },

  // Login methods
  loginMethods: ['email', 'google', 'twitter', 'discord', 'wallet'],

  // Configure supported chains - CRITICAL for Movement
  supportedChains: [
    {
      id: 30730, // Movement M1 Testnet Chain ID
      name: 'Movement M1 Testnet',
      network: 'movement-testnet',
      nativeCurrency: {
        name: 'MOVE',
        symbol: 'MOVE',
        decimals: 8,
      },
      rpcUrls: {
        default: {
          http: ['https://testnet.movementnetwork.xyz/v1'],
        },
        public: {
          http: ['https://testnet.movementnetwork.xyz/v1'],
        },
      },
      blockExplorers: {
        default: {
          name: 'Movement Explorer',
          url: 'https://explorer.movementnetwork.xyz',
        },
      },
      testnet: true,
    },
  ],

  // Default chain
  defaultChain: {
    id: 30730,
    name: 'Movement M1 Testnet',
    network: 'movement-testnet',
    nativeCurrency: {
      name: 'MOVE',
      symbol: 'MOVE',
      decimals: 8,
    },
    rpcUrls: {
      default: {
        http: ['https://testnet.movementnetwork.xyz/v1'],
      },
    },
  },
};

export const MOVEMENT_CHAIN_ID = 30730;
export const MOVEMENT_RPC_URL = 'https://testnet.movementnetwork.xyz/v1';