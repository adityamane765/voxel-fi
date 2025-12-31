'use client';

import { usePrivy } from '@privy-io/react-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { LogOut, ChevronDown, User, Mail, Loader2 } from 'lucide-react';
import { useMovementWallet } from '@/hooks/useMovementWallet';

// Social login icons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);

export function WalletConnect() {
  const { ready, authenticated, user } = usePrivy();
  const { address, login, logout, isLoading, shortenAddress } = useMovementWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  // Get user display info
  const getUserDisplay = () => {
    if (!user) return null;
    if (user.google) return { type: 'google', label: user.google.email };
    if (user.twitter) return { type: 'twitter', label: `@${user.twitter.username}` };
    if (user.discord) return { type: 'discord', label: user.discord.username };
    if (user.email) return { type: 'email', label: user.email.address };
    return null;
  };

  const userDisplay = getUserDisplay();

  if (!ready) {
    return (
      <div className="px-4 py-2 bg-white/5 rounded-full">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (authenticated && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm font-medium">{shortenAddress(address)}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />

              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-64 bg-black border border-white/10 rounded-xl overflow-hidden z-50"
              >
                {/* User Info */}
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    {userDisplay?.type === 'google' && <GoogleIcon />}
                    {userDisplay?.type === 'twitter' && <TwitterIcon />}
                    {userDisplay?.type === 'discord' && <DiscordIcon />}
                    {userDisplay?.type === 'email' && <Mail className="w-5 h-5 text-cyan-400" />}
                    {!userDisplay && <User className="w-5 h-5 text-gray-400" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {userDisplay?.label || 'Connected'}
                      </p>
                      <p className="text-xs text-gray-500">via Privy</p>
                    </div>
                  </div>

                  {/* Wallet Address */}
                  <div className="mt-3 p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Movement Wallet</p>
                    <p className="text-xs font-mono text-gray-300 break-all">
                      {address}
                    </p>
                  </div>
                </div>

                {/* Gasless Badge */}
                <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs text-cyan-400">Gasless transactions enabled</span>
                  </div>
                </div>

                {/* Disconnect */}
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={login}
      disabled={isLoading}
      className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <span>Sign In</span>
          <div className="flex items-center gap-1 ml-1 opacity-70">
            <GoogleIcon />
            <TwitterIcon />
          </div>
        </>
      )}
    </motion.button>
  );
}
