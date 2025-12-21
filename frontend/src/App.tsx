// frontend/src/App.tsx
import { WalletButton, UserProfile } from './components/WalletButton';
import { MintPositionForm } from './components/MintPositionForm';
import { useMovementWallet } from './hooks/useMovementWallet';

function App() {
  const { isConnected, address, isReady } = useMovementWallet();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Fractal DeFi
              </h1>
              <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-sm">
                Movement M1
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <UserProfile />
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="mb-8">
              <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Welcome to Fractal DeFi
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Connect your wallet to start trading with fractal liquidity positions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-3xl mb-3">📧</div>
                <h3 className="font-semibold mb-2">Email Login</h3>
                <p className="text-sm text-gray-400">No wallet extensions needed</p>
              </div>
              
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Seamless UX</h3>
                <p className="text-sm text-gray-400">No transaction popups</p>
              </div>
              
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-semibold mb-2">Secure & Safe</h3>
                <p className="text-sm text-gray-400">Non-custodial embedded wallet</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Connected State */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
              <p className="text-gray-400">
                Connected: <span className="font-mono text-indigo-400">{address}</span>
              </p>
            </div>

            {/* Mint Position Form */}
            <div className="mb-8">
              <MintPositionForm />
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-4">About Fractal Positions</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Fractal positions allow you to provide concentrated liquidity across multiple price ranges 
                  simultaneously, maximizing capital efficiency and trading fees.
                </p>
              </div>

              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Movement M1 Testnet</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  You're connected to Movement M1 Testnet. Get testnet MOVE tokens from the 
                  <a href="https://discord.gg/movementlabs" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 ml-1">
                    Movement Discord
                  </a>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Built for Movement M1 Hackathon 🚀</p>
            <p>Powered by Privy Embedded Wallets</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;