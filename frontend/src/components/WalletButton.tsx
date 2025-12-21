import { useMovementWallet } from '../hooks/useMovementWallet';
import { useState, useEffect } from 'react';
import { getAccountBalance } from '../blockchain/movement';

export function WalletButton() {
  const {
    isAuthenticated,
    isConnected,
    address,
    connect,
    disconnect,
    isConnecting,
    user,
  } = useMovementWallet();

  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address]);

  const fetchBalance = async () => {
    if (!address) return;
    
    setIsLoadingBalance(true);
    try {
      const bal = await getAccountBalance(address);
      // Convert from octas to APT (8 decimals)
      const aptBalance = (parseInt(bal) / 100000000).toFixed(4);
      setBalance(aptBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isAuthenticated || !isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Balance display */}
      <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="font-medium text-white">
            {isLoadingBalance ? (
              <span className="animate-pulse">...</span>
            ) : (
              `${balance} MOVE`
            )}
          </span>
        </div>
      </div>

      {/* Wallet info */}
      <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-mono text-white">
            {formatAddress(address!)}
          </span>
        </div>
      </div>

      {/* Disconnect button */}
      <button
        onClick={disconnect}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
      >
        Disconnect
      </button>
    </div>
  );
}

// Optional: User profile component showing email/social login
export function UserProfile() {
  const { user, isAuthenticated } = useMovementWallet();

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
      {user.email && (
        <span className="text-sm text-gray-300">{user.email.address}</span>
      )}
      {user.twitter && (
        <span className="text-sm text-gray-300">@{user.twitter.username}</span>
      )}
      {user.google && (
        <span className="text-sm text-gray-300">{user.google.email}</span>
      )}
    </div>
  );
}