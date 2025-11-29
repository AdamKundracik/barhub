import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

/**
 * TokenManager - Simple JWT token storage and management
 *
 * Responsibilities:
 * - Store/retrieve tokens securely using SecureStore
 * - In-memory cache for quick access
 * - Basic token validation (expiration check)
 * - Retry persisting tokens when app returns to foreground
 */
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private pendingTokens: { accessToken: string; refreshToken: string } | null = null;
  private appStateSubscription: any = null;

  private constructor() {
    // Set up app state listener to retry persisting tokens when app comes to foreground
    this.setupAppStateListener();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Set up app state listener to retry persisting tokens when app comes to foreground
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && this.pendingTokens) {
          // App came to foreground and we have pending tokens to persist
          this.retryPersistTokens();
        }
      }
    );
  }

  /**
   * Retry persisting tokens that failed to save earlier
   */
  private async retryPersistTokens(): Promise<void> {
    if (!this.pendingTokens) return;

    try {
      console.log('🔄 [TOKEN] Retrying to persist tokens to SecureStore');
      await Promise.all([
        SecureStore.setItemAsync('accessToken', this.pendingTokens.accessToken),
        SecureStore.setItemAsync('refreshToken', this.pendingTokens.refreshToken),
      ]);
      console.log('✅ [TOKEN] Tokens successfully persisted to SecureStore');
      this.pendingTokens = null; // Clear pending tokens after successful save
    } catch (error) {
      console.warn('⚠️ [TOKEN] Retry persist failed, will try again next time:', error);
      // Keep pendingTokens so we can retry again
    }
  }

  /**
   * Initialize tokens from SecureStore into memory cache
   */
  async initialize(): Promise<void> {
    try {
      this.accessToken = await SecureStore.getItemAsync('accessToken');
      this.refreshToken = await SecureStore.getItemAsync('refreshToken');
    } catch (error) {
      console.error('TokenManager: Error initializing:', error);
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  /**
   * Get access token from memory cache (synchronous for backward compatibility)
   * Note: Only returns cached value. Use getAccessTokenAsync() for fallback to SecureStore
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get access token with fallback to SecureStore if not in memory
   * Use this for critical operations to ensure token is always available
   */
  async getAccessTokenAsync(): Promise<string | null> {
    if (!this.accessToken) {
      try {
        this.accessToken = await SecureStore.getItemAsync('accessToken');
      } catch (error) {
        console.error('TokenManager: Error loading access token:', error);
      }
    }
    return this.accessToken;
  }

  /**
   * Get refresh token with fallback to SecureStore if not in memory
   */
  async getRefreshToken(): Promise<string | null> {
    if (!this.refreshToken) {
      try {
        this.refreshToken = await SecureStore.getItemAsync('refreshToken');
      } catch (error) {
        console.error('TokenManager: Error loading refresh token:', error);
      }
    }
    return this.refreshToken;
  }

  /**
   * Store tokens in both memory cache and SecureStore
   * If SecureStore fails (e.g., app in background), tokens are still stored in memory
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('💾 [TOKEN] Storing new tokens');

      // Always store in memory first (this will always work)
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      // Try to store in SecureStore, but don't fail if it doesn't work
      // This can happen when app is in background or device is locked
      try {
        await Promise.all([
          SecureStore.setItemAsync('accessToken', accessToken),
          SecureStore.setItemAsync('refreshToken', refreshToken),
        ]);
        console.log('✅ [TOKEN] Tokens stored in SecureStore');
        this.pendingTokens = null; // Clear any pending tokens
      } catch (secureStoreError: any) {
        // If SecureStore fails (e.g., "User interaction is not allowed"),
        // we still have tokens in memory, so we can continue
        console.warn(
          '⚠️ [TOKEN] Failed to store tokens in SecureStore (tokens still in memory):',
          secureStoreError?.message || secureStoreError
        );
        
        // Store tokens as pending so we can retry when app comes to foreground
        this.pendingTokens = { accessToken, refreshToken };
        
        // Don't throw - tokens are in memory and will work for current session
        // They'll be persisted next time app is in foreground
      }

      // Log expiration times
      const accessExp = this.getTokenExpiration(accessToken);
      const refreshExp = this.getTokenExpiration(refreshToken);
      if (accessExp) {
        console.log(
          '💾 [TOKEN] Access token expires:',
          accessExp.toLocaleString()
        );
      }
      if (refreshExp) {
        console.log(
          '💾 [TOKEN] Refresh token expires:',
          refreshExp.toLocaleString()
        );
      }
    } catch (error) {
      console.error('❌ [TOKEN] Error storing tokens:', error);
      // Only throw if we couldn't even store in memory (shouldn't happen)
      throw error;
    }
  }

  /**
   * Clear all tokens from memory and SecureStore
   */
  async clearTokens(): Promise<void> {
    try {
      console.log('🗑️ [TOKEN] Clearing all tokens');

      this.accessToken = null;
      this.refreshToken = null;
      this.pendingTokens = null;

      await Promise.all([
        SecureStore.deleteItemAsync('accessToken').catch(() => {}),
        SecureStore.deleteItemAsync('refreshToken').catch(() => {}),
      ]);

      console.log('✅ [TOKEN] Tokens cleared successfully');
    } catch (error) {
      console.error('❌ [TOKEN] Error clearing tokens:', error);
    }
  }

  /**
   * Cleanup app state listener (called when TokenManager is no longer needed)
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      // Add 30 second buffer to prevent edge cases
      return payload.exp <= currentTime + 30;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration as Date
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}

export const tokenManager = TokenManager.getInstance();
