import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface WalletState {
  ready: boolean;
  authenticated: boolean;
  address: string | null;
  shortAddress: string | null;
  login: () => void;
  logout: () => void;
}

const WalletContext = createContext<WalletState>({
  ready: true,
  authenticated: false,
  address: null,
  shortAddress: null,
  login: () => {},
  logout: () => {},
});

export function PrivyWalletProvider({ children }: { children: ReactNode }) {
  const privy = usePrivy();
  const address = privy.user?.wallet?.address || null;

  const shortAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const value = useMemo(() => ({
    ready: privy.ready,
    authenticated: privy.authenticated,
    address,
    shortAddress,
    login: privy.login,
    logout: privy.logout,
  }), [privy.ready, privy.authenticated, address, shortAddress, privy.login, privy.logout]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function FallbackWalletProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({
    ready: true,
    authenticated: false,
    address: null,
    shortAddress: null,
    login: () => {
      alert('Wallet connection not configured. Please set VITE_PRIVY_APP_ID.');
    },
    logout: () => {},
  }), []);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
