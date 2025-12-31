'use client';

import { useState, useCallback, useEffect } from 'react';
import { InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { useMovementWallet } from './useMovementWallet';

/**
 * Session Key Permission Types
 */
export type SessionPermission =
  | 'swap' // Allow swaps up to a limit
  | 'claim_fees' // Allow claiming fees
  | 'view' // Allow read-only operations
  | 'all'; // Full access (use carefully)

export interface SessionConfig {
  permissions: SessionPermission[];
  maxSwapAmount: number; // Maximum single swap amount
  dailySwapLimit: number; // Maximum total daily swap volume
  expiresAt: number; // Unix timestamp
}

export interface SessionState {
  isActive: boolean;
  config: SessionConfig | null;
  usedToday: number;
  remainingLimit: number;
  expiresIn: string;
}

export interface UseSessionKeysReturn {
  // Session state
  session: SessionState;
  isSessionActive: boolean;

  // Session management
  createSession: (config: Partial<SessionConfig>) => Promise<boolean>;
  revokeSession: () => void;
  extendSession: (hours: number) => void;

  // Transaction execution with session
  executeWithSession: (
    permission: SessionPermission,
    payload: InputEntryFunctionData,
    amount?: number
  ) => Promise<{ success: boolean; hash?: string; error?: string }>;

  // Permission checks
  canExecute: (permission: SessionPermission, amount?: number) => boolean;
  getRemainingLimit: (permission: SessionPermission) => number;
}

// Storage key for session data
const SESSION_STORAGE_KEY = 'voxelfi_session';

/**
 * Session Keys Hook
 *
 * Enables "remember me" functionality for repeat actions:
 * - Create time-limited sessions with specific permissions
 * - Execute swaps without re-confirmation (within limits)
 * - Automatic session expiry and cleanup
 *
 * This is a client-side implementation for the hackathon.
 * Production would use Privy's delegated signing or smart account sessions.
 */
export function useSessionKeys(): UseSessionKeysReturn {
  const wallet = useMovementWallet();
  const { signAndSubmitTransaction, address } = wallet;
  const isConnected = wallet.isConnected;
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    config: null,
    usedToday: 0,
    remainingLimit: 0,
    expiresIn: '',
  });

  // Load session from storage
  useEffect(() => {
    if (!address) {
      setSession({
        isActive: false,
        config: null,
        usedToday: 0,
        remainingLimit: 0,
        expiresIn: '',
      });
      return;
    }

    try {
      const stored = localStorage.getItem(`${SESSION_STORAGE_KEY}_${address}`);
      if (stored) {
        const data = JSON.parse(stored);

        // Check if expired
        if (data.config.expiresAt < Date.now()) {
          localStorage.removeItem(`${SESSION_STORAGE_KEY}_${address}`);
          return;
        }

        // Reset daily usage if new day
        const today = new Date().toDateString();
        if (data.lastUsageDate !== today) {
          data.usedToday = 0;
          data.lastUsageDate = today;
        }

        const remainingLimit = data.config.dailySwapLimit - data.usedToday;
        const expiresIn = formatTimeRemaining(data.config.expiresAt);

        setSession({
          isActive: true,
          config: data.config,
          usedToday: data.usedToday,
          remainingLimit,
          expiresIn,
        });
      }
    } catch {
      // Invalid stored data
    }
  }, [address]);

  // Update expiry countdown
  useEffect(() => {
    if (!session.isActive || !session.config) return;

    const interval = setInterval(() => {
      if (session.config!.expiresAt < Date.now()) {
        revokeSession();
      } else {
        setSession((prev) => ({
          ...prev,
          expiresIn: formatTimeRemaining(prev.config!.expiresAt),
        }));
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session.isActive, session.config]);

  // Create a new session
  const createSession = useCallback(
    async (config: Partial<SessionConfig>): Promise<boolean> => {
      if (!isConnected || !address) return false;

      const fullConfig: SessionConfig = {
        permissions: config.permissions || ['swap', 'claim_fees'],
        maxSwapAmount: config.maxSwapAmount || 100, // Default $100 per swap
        dailySwapLimit: config.dailySwapLimit || 1000, // Default $1000 daily
        expiresAt: config.expiresAt || Date.now() + 24 * 60 * 60 * 1000, // Default 24 hours
      };

      const sessionData = {
        config: fullConfig,
        usedToday: 0,
        lastUsageDate: new Date().toDateString(),
      };

      try {
        localStorage.setItem(`${SESSION_STORAGE_KEY}_${address}`, JSON.stringify(sessionData));

        setSession({
          isActive: true,
          config: fullConfig,
          usedToday: 0,
          remainingLimit: fullConfig.dailySwapLimit,
          expiresIn: formatTimeRemaining(fullConfig.expiresAt),
        });

        return true;
      } catch {
        return false;
      }
    },
    [isConnected, address]
  );

  // Revoke current session
  const revokeSession = useCallback(() => {
    if (address) {
      localStorage.removeItem(`${SESSION_STORAGE_KEY}_${address}`);
    }
    setSession({
      isActive: false,
      config: null,
      usedToday: 0,
      remainingLimit: 0,
      expiresIn: '',
    });
  }, [address]);

  // Extend session expiry
  const extendSession = useCallback(
    (hours: number) => {
      if (!session.config || !address) return;

      const newExpiry = Math.max(session.config.expiresAt, Date.now()) + hours * 60 * 60 * 1000;

      const updatedConfig = { ...session.config, expiresAt: newExpiry };

      const stored = localStorage.getItem(`${SESSION_STORAGE_KEY}_${address}`);
      if (stored) {
        const data = JSON.parse(stored);
        data.config = updatedConfig;
        localStorage.setItem(`${SESSION_STORAGE_KEY}_${address}`, JSON.stringify(data));
      }

      setSession((prev) => ({
        ...prev,
        config: updatedConfig,
        expiresIn: formatTimeRemaining(newExpiry),
      }));
    },
    [session.config, address]
  );

  // Check if action can be executed with session
  const canExecute = useCallback(
    (permission: SessionPermission, amount?: number): boolean => {
      if (!session.isActive || !session.config) return false;

      // Check permission
      const hasPermission =
        session.config.permissions.includes('all') ||
        session.config.permissions.includes(permission);

      if (!hasPermission) return false;

      // Check amount limits for swaps
      if (permission === 'swap' && amount) {
        if (amount > session.config.maxSwapAmount) return false;
        if (session.usedToday + amount > session.config.dailySwapLimit) return false;
      }

      // Check expiry
      if (session.config.expiresAt < Date.now()) return false;

      return true;
    },
    [session]
  );

  // Get remaining limit for permission
  const getRemainingLimit = useCallback(
    (permission: SessionPermission): number => {
      if (!session.isActive || !session.config) return 0;

      if (permission === 'swap') {
        return Math.min(
          session.config.maxSwapAmount,
          session.config.dailySwapLimit - session.usedToday
        );
      }

      return Infinity;
    },
    [session]
  );

  // Execute transaction with session (no confirmation needed)
  const executeWithSession = useCallback(
    async (
      permission: SessionPermission,
      payload: InputEntryFunctionData,
      amount?: number
    ): Promise<{ success: boolean; hash?: string; error?: string }> => {
      if (!canExecute(permission, amount)) {
        return {
          success: false,
          error: 'Session does not permit this action or limit exceeded',
        };
      }

      const result = await signAndSubmitTransaction(payload);

      // Update usage if successful swap
      if (result.success && permission === 'swap' && amount && address) {
        const newUsage = session.usedToday + amount;

        const stored = localStorage.getItem(`${SESSION_STORAGE_KEY}_${address}`);
        if (stored) {
          const data = JSON.parse(stored);
          data.usedToday = newUsage;
          localStorage.setItem(`${SESSION_STORAGE_KEY}_${address}`, JSON.stringify(data));
        }

        setSession((prev) => ({
          ...prev,
          usedToday: newUsage,
          remainingLimit: prev.config!.dailySwapLimit - newUsage,
        }));
      }

      return result;
    },
    [canExecute, signAndSubmitTransaction, session.usedToday, address]
  );

  return {
    session,
    isSessionActive: session.isActive,
    createSession,
    revokeSession,
    extendSession,
    executeWithSession,
    canExecute,
    getRemainingLimit,
  };
}

// Helper to format time remaining
function formatTimeRemaining(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
