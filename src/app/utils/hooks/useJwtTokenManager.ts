import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authService } from '../../services/authService';

interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
}

class JwtTokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  /**
   * Decode JWT token and extract payload
   */
  private decodeJwtToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Get token expiration time in milliseconds
   */
  private getTokenExpirationTime(token: string): number | null {
    const payload = this.decodeJwtToken(token);
    if (!payload || !payload.exp) {
      return null;
    }

    // Convert Unix timestamp to milliseconds
    return payload.exp * 1000;
  }

  /**
   * Calculate when to refresh token (5 minutes before expiration)
   */
  private getRefreshTime(expirationTime: number): number {
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Math.max(0, expirationTime - Date.now() - refreshBuffer);
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(token: string): void {
    // Clear existing timer
    this.clearRefreshTimer();

    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) {
      return;
    }

    const refreshTime = this.getRefreshTime(expirationTime);
    
    if (refreshTime <= 0) {
      // Token expires very soon, refresh immediately
      this.refreshToken();
      return;
    }
    
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  /**
   * Clear the refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Refresh token with debouncing to prevent multiple simultaneous refreshes
   */
  private async refreshToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const newToken = await authService.refreshAccessToken();
      
      if (newToken) {
        // Schedule next refresh for the new token
        this.scheduleTokenRefresh(newToken);
        return newToken;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Initialize token management with current token
   */
  public initialize(token: string): void {
    this.scheduleTokenRefresh(token);
  }

  /**
   * Initialize token management with current token from auth service
   */
  public async initializeFromAuthService(): Promise<void> {
    try {
      // Use getValidAccessToken to ensure we have a valid token (will refresh if needed)
      const token = await authService.getValidAccessToken();
      if (token) {
        this.initialize(token);
      }
    } catch (error) {
      console.error('Error initializing JWT token manager from auth service:', error);
    }
  }

  /**
   * Stop token management
   */
  public stop(): void {
    this.clearRefreshTimer();
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Force immediate token refresh
   */
  public async forceRefresh(): Promise<string | null> {
    this.clearRefreshTimer();
    return this.refreshToken();
  }

  /**
   * Get current token expiration info
   */
  public getTokenInfo(token: string): { 
    expirationTime: number | null; 
    timeUntilExpiration: number | null;
    timeUntilRefresh: number | null;
  } {
    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) {
      return { expirationTime: null, timeUntilExpiration: null, timeUntilRefresh: null };
    }

    const timeUntilExpiration = expirationTime - Date.now();
    const timeUntilRefresh = this.getRefreshTime(expirationTime);

    return {
      expirationTime,
      timeUntilExpiration,
      timeUntilRefresh
    };
  }
}

// Singleton instance
const jwtTokenManager = new JwtTokenManager();

/**
 * Hook for managing JWT token refresh
 */
export const useJwtTokenManager = () => {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Initialize token management when user logs in
   */
  const initializeTokenManagement = useCallback(async () => {
    try {
      await jwtTokenManager.initializeFromAuthService();
    } catch (error) {
      console.error('Error initializing token management:', error);
    }
  }, []);

  /**
   * Stop token management when user logs out
   */
  const stopTokenManagement = useCallback(() => {
    jwtTokenManager.stop();
  }, []);

  /**
   * Force token refresh (useful for manual refresh)
   */
  const forceTokenRefresh = useCallback(async (): Promise<string | null> => {
    return jwtTokenManager.forceRefresh();
  }, []);

  /**
   * Get token information
   */
  const getTokenInfo = useCallback(async () => {
    try {
      // Use getValidAccessToken to ensure we have a valid token (will refresh if needed)
      const token = await authService.getValidAccessToken();
      if (token) {
        return jwtTokenManager.getTokenInfo(token);
      }
      return null;
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        
        try {
          // Use getValidAccessToken to ensure we have a valid token (will refresh if needed)
          const token = await authService.getValidAccessToken();
          if (token) {
            // Reinitialize token management with valid token
            jwtTokenManager.initialize(token);
          } else {
            // No valid token available (refresh failed), stop management
            jwtTokenManager.stop();
          }
        } catch (error) {
          console.error('Error checking token on app foreground:', error);
          jwtTokenManager.stop();
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      jwtTokenManager.stop();
    };
  }, []);

  return {
    initializeTokenManagement,
    stopTokenManagement,
    forceTokenRefresh,
    getTokenInfo,
  };
};

export default jwtTokenManager;
