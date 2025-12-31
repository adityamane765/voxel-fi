'use client';

import { PropsWithChildren } from 'react';
import PrivyProvider from './PrivyProvider';

/**
 * Unified Wallet Provider
 *
 * Uses Privy for:
 * - Social login (email, Google, Twitter, Discord)
 * - Embedded wallet creation
 * - Seamless onboarding without wallet extensions
 *
 * Movement Network transactions are handled by the embedded Aptos wallet
 */
export function WalletProvider({ children }: PropsWithChildren) {
  return <PrivyProvider>{children}</PrivyProvider>;
}
