'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useMovementWallet } from '@/hooks/useMovementWallet';
import { useTransactionBatch, TransactionPresets } from '@/hooks/useTransactionBatch';
import { useSessionKeys } from '@/hooks/useSessionKeys';
import { config } from '@/config';
import {
  Sparkles,
  Wallet,
  Zap,
  Shield,
  Check,
  ArrowRight,
  Loader2,
  Clock,
  X,
} from 'lucide-react';

// Social login icons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type OnboardingStep = 'welcome' | 'login' | 'wallet' | 'tokens' | 'session' | 'complete';

const STEP_ORDER: OnboardingStep[] = ['welcome', 'login', 'wallet', 'tokens', 'session', 'complete'];

export function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const { ready, authenticated, login: privyLogin } = usePrivy();
  const { address, isLoading: walletLoading, shortenAddress } = useMovementWallet();
  const { addToQueue, executeAll, isExecuting, progress, queue } = useTransactionBatch();
  const { createSession } = useSessionKeys();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tokensReceived, setTokensReceived] = useState(false);

  // Timer for 60-second demo tracking
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  // Auto-advance when authenticated
  useEffect(() => {
    if (authenticated && address && step === 'login') {
      setStep('wallet');
      setTimeout(() => setStep('tokens'), 1500);
    }
  }, [authenticated, address, step]);

  // Start the demo
  const handleStart = useCallback(() => {
    setStartTime(Date.now());
    setStep('login');
  }, []);

  // Handle login
  const handleLogin = useCallback(() => {
    privyLogin();
  }, [privyLogin]);

  // Request test tokens
  const handleGetTokens = useCallback(async () => {
    if (!address) return;

    // Add token mint transactions to batch
    const preset = TransactionPresets.mintAndCreatePosition(
      config.moduleAddress,
      0.1, // 0.1 WETH
      200, // 200 USDC
      2000, // Price center $2000
      5, // 5% spread
      1, // Fibonacci fractal
      3 // Depth 3
    );

    // Only add the first two (mint tokens)
    addToQueue(preset[0].name, preset[0].payload);
    addToQueue(preset[1].name, preset[1].payload);

    const result = await executeAll();

    if (result.success) {
      setTokensReceived(true);
      setStep('session');
    }
  }, [address, addToQueue, executeAll]);

  // Create session for seamless trading
  const handleCreateSession = useCallback(async () => {
    const success = await createSession({
      permissions: ['swap', 'claim_fees'],
      maxSwapAmount: 500,
      dailySwapLimit: 5000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    if (success) {
      setStep('complete');
    }
  }, [createSession]);

  // Skip session creation
  const handleSkipSession = useCallback(() => {
    setStep('complete');
  }, []);

  // Complete onboarding
  const handleComplete = useCallback(() => {
    onComplete?.();
    onClose();
  }, [onComplete, onClose]);

  // Get step index for progress
  const stepIndex = STEP_ORDER.indexOf(step);
  const progressPercent = (stepIndex / (STEP_ORDER.length - 1)) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl p-8 max-w-lg w-full overflow-hidden"
        >
          {/* Close button */}
          {step !== 'complete' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {/* Timer badge */}
          {startTime && step !== 'complete' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 rounded-full">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-mono text-cyan-400">{elapsedTime}s</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              {/* Welcome Step */}
              {step === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Welcome to VoxelFi</h2>
                  <p className="text-gray-400 mb-8">
                    Get started in under 60 seconds. No wallet extension needed, no seed phrases to
                    save. Just sign in and start earning.
                  </p>

                  <div className="space-y-3 mb-8">
                    <Feature icon={Wallet} text="Instant wallet creation with social login" />
                    <Feature icon={Zap} text="Gasless transactions sponsored for you" />
                    <Feature icon={Shield} text="Privacy-preserving liquidity positions" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStart}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium text-lg flex items-center justify-center gap-2"
                  >
                    Start Demo
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}

              {/* Login Step */}
              {step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold mb-2">Sign In</h2>
                  <p className="text-gray-400 mb-8">
                    Choose your preferred method. We'll create a secure wallet for you
                    automatically.
                  </p>

                  <div className="space-y-3">
                    <SocialButton
                      icon={<GoogleIcon />}
                      label="Continue with Google"
                      onClick={handleLogin}
                      color="bg-white text-black"
                    />
                    <SocialButton
                      icon={<TwitterIcon />}
                      label="Continue with X"
                      onClick={handleLogin}
                      color="bg-black border border-white/20 text-white"
                    />
                    <SocialButton
                      icon={<DiscordIcon />}
                      label="Continue with Discord"
                      onClick={handleLogin}
                      color="bg-[#5865F2] text-white"
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-6">
                    By continuing, you agree to our Terms of Service
                  </p>
                </motion.div>
              )}

              {/* Wallet Creation Step */}
              {step === 'wallet' && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    {walletLoading ? (
                      <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
                    ) : (
                      <Check className="w-10 h-10 text-green-400" />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Wallet Created!</h2>
                  <p className="text-gray-400 mb-4">Your Movement wallet is ready</p>

                  {address && (
                    <div className="p-4 bg-white/5 rounded-xl mb-8">
                      <p className="text-xs text-gray-500 mb-1">Your Address</p>
                      <p className="font-mono text-sm">{shortenAddress(address)}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing tokens...
                  </div>
                </motion.div>
              )}

              {/* Get Tokens Step */}
              {step === 'tokens' && (
                <motion.div
                  key="tokens"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold mb-2">Get Test Tokens</h2>
                  <p className="text-gray-400 mb-6">
                    Receive free testnet tokens to try VoxelFi
                  </p>

                  {isExecuting ? (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">
                          {queue[progress.current - 1]?.name || 'Processing...'}
                        </span>
                        <span className="text-sm text-cyan-400">
                          {progress.current}/{progress.total}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : tokensReceived ? (
                    <div className="mb-8 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                      <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 font-medium">Tokens received!</p>
                      <p className="text-sm text-gray-400 mt-1">0.1 WETH + 200 USDC</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <TokenCard symbol="WETH" amount="0.1" icon="🔷" />
                      <TokenCard symbol="USDC" amount="200" icon="💵" />
                    </div>
                  )}

                  {!tokensReceived && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGetTokens}
                      disabled={isExecuting}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Minting Tokens...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Get Free Tokens
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Session Creation Step */}
              {step === 'session' && (
                <motion.div
                  key="session"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Enable Quick Trading</h2>
                  <p className="text-gray-400 mb-6">
                    Create a session for seamless swaps without confirming each transaction
                  </p>

                  <div className="p-4 bg-white/5 rounded-xl mb-6 text-left">
                    <h4 className="font-medium mb-3">Session Permissions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Max per swap</span>
                        <span>$500</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Daily limit</span>
                        <span>$5,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Expires</span>
                        <span>7 days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateSession}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium"
                    >
                      Enable Quick Trading
                    </motion.button>
                    <button
                      onClick={handleSkipSession}
                      className="w-full py-3 text-gray-400 hover:text-white transition-colors"
                    >
                      Skip for now
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Complete Step */}
              {step === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
                  <p className="text-gray-400 mb-4">
                    Completed in{' '}
                    <span className="text-cyan-400 font-bold">{elapsedTime} seconds</span>
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-cyan-400">0.1</p>
                      <p className="text-sm text-gray-500">WETH</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-green-400">200</p>
                      <p className="text-sm text-gray-500">USDC</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleComplete}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium text-lg"
                  >
                    Start Trading
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper components
function Feature({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-3 ${color}`}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function TokenCard({ symbol, amount, icon }: { symbol: string; amount: string; icon: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xl font-bold">{amount}</p>
      <p className="text-sm text-gray-500">{symbol}</p>
    </div>
  );
}
