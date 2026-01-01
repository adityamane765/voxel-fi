'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { config } from '@/config';

/**
 * Privy Provider configured for Movement Network
 *
 * Features:
 * - Social login (email, Google, Twitter, Discord)
 * - Aptos embedded wallet creation (works on Movement)
 * - Automatic wallet creation on login
 * - No seed phrase, no wallet extension needed
 */
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
        // Embedded wallets configuration for Movement (Aptos-compatible)
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
          solana: {
            createOnLogin: 'users-without-wallets',
          },
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
