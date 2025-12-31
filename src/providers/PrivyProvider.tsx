'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { config } from '@/config';

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Privy
      appId={config.privy.appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#06b6d4',
          logo: '/logo.png',
        },
        loginMethods: ['wallet', 'email', 'google'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </Privy>
  );
}
