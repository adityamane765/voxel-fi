import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { config } from './config'
import { PrivyProvider } from '@privy-io/react-auth'
import { PrivyWalletProvider, FallbackWalletProvider } from './context/WalletContext'

function Root() {
  if (config.privy.appId) {
    return (
      <PrivyProvider
        appId={config.privy.appId}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#22D3EE',
          },
          loginMethods: ['email', 'google', 'twitter', 'wallet'],
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'users-without-wallets',
            },
          },
        }}
      >
        <PrivyWalletProvider>
          <App />
        </PrivyWalletProvider>
      </PrivyProvider>
    );
  }
  
  return (
    <FallbackWalletProvider>
      <App />
    </FallbackWalletProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
