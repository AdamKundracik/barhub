import { useState, useEffect } from 'react';
import { tokenManager } from '../api/tokenManager';

export interface TokenProtectionState {
  hasTokensInMemory: boolean;
  hasValidRefreshToken: boolean;
  initialCheckDone: boolean;
  networkWaitDone: boolean;
}

interface UseTokenProtectionResult {
  protectionState: TokenProtectionState;
  shouldShowLoading: boolean;
}

/**
 * Hook for managing token-based protection state during authentication.
 * Prevents premature navigation to auth screen when tokens might still be valid.
 *
 * @param isAuthLoading - Whether auth provider is currently loading
 * @param isAuthenticated - Whether user is authenticated
 * @returns Protection state and loading indicator
 */
export const useTokenProtection = (
  isAuthLoading: boolean,
  isAuthenticated: boolean
): UseTokenProtectionResult => {
  const [protectionState, setProtectionState] = useState<TokenProtectionState>({
    hasTokensInMemory: false,
    hasValidRefreshToken: false,
    initialCheckDone: false,
    networkWaitDone: false,
  });

  // Single effect to handle all token checks
  useEffect(() => {
    const checkTokenStatus = async () => {
      try {
        // Check tokens in memory
        const hasTokens = tokenManager.hasTokensInMemory();

        // Check refresh token validity (only if no tokens in memory and not authenticated)
        let hasValidRefresh = false;
        if (!hasTokens && !isAuthenticated && !isAuthLoading) {
          try {
            const refreshToken = await tokenManager.getRefreshToken();
            hasValidRefresh = !!(
              refreshToken &&
              refreshToken !== '' &&
              !tokenManager.isTokenExpired(refreshToken)
            );
          } catch (error) {
            hasValidRefresh = false;
          }
        }

        setProtectionState(prev => ({
          ...prev,
          hasTokensInMemory: hasTokens,
          hasValidRefreshToken: hasValidRefresh,
        }));
      } catch (error) {
        console.error('[useTokenProtection] Error checking token status:', error);
      }
    };

    // Check immediately
    checkTokenStatus();

    // Set up interval only during auth loading
    let interval: NodeJS.Timeout | null = null;
    if (isAuthLoading) {
      interval = setInterval(checkTokenStatus, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthLoading, isAuthenticated]);

  // Initial check timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setProtectionState(prev => ({ ...prev, initialCheckDone: true }));
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Network wait timer for refresh token scenario
  useEffect(() => {
    if (protectionState.hasValidRefreshToken) {
      const timer = setTimeout(() => {
        setProtectionState(prev => ({ ...prev, networkWaitDone: true }));
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setProtectionState(prev => ({ ...prev, networkWaitDone: false }));
    }
  }, [protectionState.hasValidRefreshToken]);

  // Calculate if loading should be shown based on protection states
  const shouldShowLoading = (() => {
    // 1. TOKENS IN MEMORY PROTECTION: If we have tokens but auth check is not complete, wait
    if (protectionState.hasTokensInMemory && !isAuthenticated && !isAuthLoading) {
      console.log(
        '[useTokenProtection] Have tokens in memory but not authenticated yet, waiting...'
      );
      return true;
    }

    // 2. REFRESH TOKEN PROTECTION: If we have valid refresh token but auth failed, wait for network
    if (
      !isAuthenticated &&
      !isAuthLoading &&
      protectionState.hasValidRefreshToken &&
      !protectionState.networkWaitDone
    ) {
      console.log(
        '[useTokenProtection] Valid refresh token detected but auth failed - possible network issue, waiting...'
      );
      return true;
    }

    // 3. INITIAL CHECK PROTECTION: Brief wait to determine token status
    if (
      !isAuthLoading &&
      !isAuthenticated &&
      !protectionState.hasTokensInMemory &&
      !protectionState.initialCheckDone
    ) {
      return true;
    }

    return false;
  })();

  return {
    protectionState,
    shouldShowLoading,
  };
};
