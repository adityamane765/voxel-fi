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
          showWalletLoginFirst: false,
        },
        // Social login methods - key for smooth onboarding
        loginMethods: ['email', 'google', 'twitter', 'discord'],
        // Embedded wallets configuration
        embeddedWallets: {
          // Show wallet UI after login for first-time users
          showWalletUIs: true,
        },
        // Legal/compliance
        legal: {
          termsAndConditionsUrl: 'https://voxelfi.xyz/terms',
          privacyPolicyUrl: 'https://voxelfi.xyz/privacy',
        },
      }}
    >
      {children}
    </Privy>
  );
}
