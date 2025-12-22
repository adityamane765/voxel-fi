import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import { config } from '../config';

interface Props {
  children: ReactNode;
}

export function PrivyProvider({ children }: Props) {
  if (!config.privy.appId) {
    console.warn('Privy App ID not configured. Wallet features will be disabled.');
    return <>{children}</>;
  }

  return (
    <BasePrivyProvider
      appId={config.privy.appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#22D3EE',
          logo: '/voxel.svg',
        },
        loginMethods: ['email', 'google', 'twitter', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
