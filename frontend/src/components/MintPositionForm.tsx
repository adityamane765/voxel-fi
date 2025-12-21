import { useState } from 'react';
import { useMovementWallet } from '../hooks/useMovementWallet';
import { mintPosition } from '../blockchain/movement';

export function MintPositionForm() {
  const { signAndSubmitTransaction, address, isConnected } = useMovementWallet();
  
  const [formData, setFormData] = useState({
    amountX: 1000,
    amountY: 1000,
    priceCenter: 100,
    spread: 10,
    fractalType: 0,
    depth: 3,
  });
  
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await mintPosition(
        signAndSubmitTransaction,
        address,
        formData
      );

      setTxHash(result.hash || result.transactionHash);
      console.log('✅ Position minted successfully!', result);
      
      // Reset form or show success message
      alert('Position minted successfully!');
    } catch (err: any) {
      console.error('Failed to mint position:', err);
      setError(err.message || 'Failed to mint position');
    } finally {
      setIsMinting(false);
    }
  };

  const handleChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-center">
          Please connect your wallet to mint a position
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Mint Fractal Position</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount X
            </label>
            <input
              type="number"
              value={formData.amountX}
              onChange={(e) => handleChange('amountX', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount Y
            </label>
            <input
              type="number"
              value={formData.amountY}
              onChange={(e) => handleChange('amountY', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price Center
            </label>
            <input
              type="number"
              value={formData.priceCenter}
              onChange={(e) => handleChange('priceCenter', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spread
            </label>
            <input
              type="number"
              value={formData.spread}
              onChange={(e) => handleChange('spread', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fractal Type
            </label>
            <input
              type="number"
              value={formData.fractalType}
              onChange={(e) => handleChange('fractalType', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
              min="0"
              max="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Depth
            </label>
            <input
              type="number"
              value={formData.depth}
              onChange={(e) => handleChange('depth', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
              min="1"
              max="10"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {txHash && (
          <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg">
            <p className="text-green-300 text-sm">
              Transaction submitted: 
              <a
                href={`https://explorer.movementnetwork.xyz/txn/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline hover:text-green-200"
              >
                View on Explorer
              </a>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isMinting}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMinting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Minting Position...
            </span>
          ) : (
            'Mint Position'
          )}
        </button>
      </form>
    </div>
  );
}