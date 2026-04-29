import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

/**
 * TokenManager - Simplified JWT token storage and management
 * 
 * Senior-level design principles:
 * - Simple and predictable API
 * - Synchronous memory access for performance
 * - Asynchronous SecureStore operations only when needed
 * - No complex initialization - tokens load on demand
 * - Robust error handling without blocking the app
 */

/**
 * SecureStore options with AFTER_FIRST_UNLOCK accessibility.
 * 
 * This fixes the "User interaction is not allowed" error on iOS.
 * 
 * WHEN_UNLOCKED (default): Only accessible when device is unlocked AND app was foregrounded
 * AFTER_FIRST_UNLOCK: Accessible after first unlock since device restart, even in background
 * 
 * This is safe for auth tokens as they are still encrypted and protected by Keychain.
 */
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private appStateSubscription: any = null;
  private lastSecureStoreError: string | null = null;
  private secureStoreRetryCount: number = 0;
  private static readonly MAX_RETRY_COUNT = 3;
  private static readonly RETRY_DELAY_MS = 500;

  private constructor() {
    this.setupAppStateListener();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Check if error is a temporary SecureStore error that can be retried
   */
  private isTemporarySecureStoreError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // iOS errors that are temporary and can be retried:
    // - "User interaction is not allowed" - device is locked or app is in background
    // - "The user name or passphrase you entered is not correct" - keychain locked
    return (
      errorMessage.includes('User interaction is not allowed') ||
      errorMessage.includes('user name or passphrase') ||
      errorMessage.includes('SecItemCopyMatching') ||
      errorMessage.includes('errSecInteractionNotAllowed')
    );
  }

  /**
   * App state listener - retry token loading when app becomes active
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        // When app becomes active and we had a SecureStore error, retry loading tokens
        if (nextAppState === 'active' && this.lastSecureStoreError) {
          // Reset the failed state to allow retry
          if (this.accessToken === '') {
            this.accessToken = null;
          }
          if (this.refreshToken === '') {
            this.refreshToken = null;
          }
          this.lastSecureStoreError = null;
          
          // Try to preload tokens again
          await this.preloadTokens();
        }
      }
    );
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get access token - loads from SecureStore if not in memory
   * This is the main method for getting tokens
   * Includes retry logic for temporary SecureStore errors
   */
  async getAccessToken(): Promise<string | null> {
    // Return cached token if available and not empty (fast path)
    if (this.accessToken && this.accessToken !== '') {
      return this.accessToken;
    }
    
    // If already tried and permanently failed (empty string), don't retry
    // But if we had a temporary error (lastSecureStoreError is set), we should retry
    if (this.accessToken === '' && !this.lastSecureStoreError) {
      return null;
    }

    // Load from SecureStore with retry logic
    for (let attempt = 1; attempt <= TokenManager.MAX_RETRY_COUNT; attempt++) {
      try {
        const token = await SecureStore.getItemAsync('accessToken', secureStoreOptions);
        this.accessToken = token || '';
        this.lastSecureStoreError = null;
        return token;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTemporary = this.isTemporarySecureStoreError(error);
        
        if (isTemporary && attempt < TokenManager.MAX_RETRY_COUNT) {
          await this.sleep(TokenManager.RETRY_DELAY_MS * attempt);
          continue;
        }
        
        if (isTemporary) {
          // Temporary error - don't mark as permanently failed
          this.lastSecureStoreError = errorMessage;
          return null;
        }
        
        // Permanent error
        console.error('[TOKEN] Error loading access token:', error);
        this.accessToken = '';
        return null;
      }
    }
    
    return null;
  }

  /**
   * Get refresh token - loads from SecureStore if not in memory
   * Includes retry logic for temporary SecureStore errors
   */
  async getRefreshToken(): Promise<string | null> {
    // Return cached token if available and not empty (fast path)
    if (this.refreshToken && this.refreshToken !== '') {
      return this.refreshToken;
    }
    
    // If already tried and permanently failed (empty string), don't retry
    if (this.refreshToken === '' && !this.lastSecureStoreError) {
      return null;
    }

    // Load from SecureStore with retry logic
    for (let attempt = 1; attempt <= TokenManager.MAX_RETRY_COUNT; attempt++) {
      try {
        const token = await SecureStore.getItemAsync('refreshToken', secureStoreOptions);
        this.refreshToken = token || '';
        this.lastSecureStoreError = null;
        return token;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTemporary = this.isTemporarySecureStoreError(error);
        
        if (isTemporary && attempt < TokenManager.MAX_RETRY_COUNT) {
          await this.sleep(TokenManager.RETRY_DELAY_MS * attempt);
          continue;
        }
        
        if (isTemporary) {
          // Temporary error - don't mark as permanently failed
          this.lastSecureStoreError = errorMessage;
          return null;
        }
        
        // Permanent error
        console.error('[TOKEN] Error loading refresh token:', error);
        this.refreshToken = '';
        return null;
      }
    }
    
    return null;
  }

  /**
   * Get access token synchronously from memory cache
   * Used by axios interceptor - token should already be loaded
   */
  getAccessTokenSync(): string | null {
    return this.accessToken;
  }

  /**
   * Store tokens in memory and SecureStore
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    // Always update in-memory cache first (critical for immediate use)
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    // Persist to SecureStore (best effort - don't block if it fails)
    try {
      await Promise.all([
        SecureStore.setItemAsync('accessToken', accessToken, secureStoreOptions),
        SecureStore.setItemAsync('refreshToken', refreshToken, secureStoreOptions),
      ]);
    } catch (error) {
      console.error('[TOKEN] Error persisting tokens to SecureStore:', error);
      // Don't throw - tokens are in memory and will work for current session
    }
  }

  /**
   * Clear all tokens from memory and SecureStore
   */
  async clearTokens(): Promise<void> {
    // Clear in-memory cache
    this.accessToken = null;
    this.refreshToken = null;

    // Clear from SecureStore (best effort)
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('accessToken', secureStoreOptions).catch(() => {}),
        SecureStore.deleteItemAsync('refreshToken', secureStoreOptions).catch(() => {}),
      ]);
    } catch (error) {
      console.error('[TOKEN] Error clearing tokens from SecureStore:', error);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      // 30s buffer — covers clock skew + network latency without falsely
      // flagging short-lived tokens (e.g. 60s test tokens) as already expired.
      const bufferTime = 30 * 1000;
      const isExpired = currentTime >= expirationTime - bufferTime;
      return isExpired;
    } catch (error) {
      console.error('[TOKEN] Error parsing token:', error);
      return true; // If we can't parse, consider it expired
    }
  }

  /**
   * Read the JWT `exp` claim (seconds since epoch) from an access token.
   * Returns null if the token can't be decoded. Used to feed
   * BackgroundGeolocation's `authorization.expires` so the plugin can
   * refresh proactively instead of reacting to a 401.
   */
  getTokenExpirationSeconds(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }

  /**
   * Preload tokens into memory for faster access
   * Call this during app initialization to avoid delays later
   * Includes retry logic for temporary SecureStore errors
   */
  async preloadTokens(): Promise<boolean> {
    // If we already have valid tokens in memory, return true
    if (this.accessToken && this.accessToken !== '' && 
        this.refreshToken && this.refreshToken !== '') {
      return true;
    }

    let lastError: any = null;
    
    for (let attempt = 1; attempt <= TokenManager.MAX_RETRY_COUNT; attempt++) {
      try {
        const [accessToken, refreshToken] = await Promise.all([
          SecureStore.getItemAsync('accessToken', secureStoreOptions),
          SecureStore.getItemAsync('refreshToken', secureStoreOptions),
        ]);
        
        this.accessToken = accessToken || '';
        this.refreshToken = refreshToken || '';
        this.lastSecureStoreError = null;
        this.secureStoreRetryCount = 0;
        
        const hasValidTokens = !!(accessToken && refreshToken);
        return hasValidTokens;
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTemporary = this.isTemporarySecureStoreError(error);
        
        if (isTemporary && attempt < TokenManager.MAX_RETRY_COUNT) {
          await this.sleep(TokenManager.RETRY_DELAY_MS * attempt); // Progressive delay
          continue;
        }
        
        // If it's a temporary error but we've exhausted retries, don't mark as permanently failed
        if (isTemporary) {
          this.lastSecureStoreError = errorMessage;
          this.secureStoreRetryCount++;
          // DON'T set to empty string - leave as null so we can retry later
          // this.accessToken and this.refreshToken remain null
          return false;
        }
        
        // Permanent error - mark as failed
        break;
      }
    }
    
    // All retries failed with non-temporary error
    console.error('[TOKEN] Error preloading tokens:', lastError);
    
    // Only mark as permanently failed for non-temporary errors
    if (!this.isTemporarySecureStoreError(lastError)) {
      this.accessToken = '';
      this.refreshToken = '';
    }
    
    return false;
  }

  /**
   * Check if we have tokens in memory (fast check)
   */
  hasTokensInMemory(): boolean {
    return !!(this.accessToken && this.refreshToken && 
              this.accessToken !== '' && this.refreshToken !== '');
  }

  /**
   * Check if we had a temporary SecureStore error
   * This indicates that tokens might exist but we couldn't access them
   */
  hasTemporarySecureStoreError(): boolean {
    return this.lastSecureStoreError !== null;
  }

  /**
   * Get the last SecureStore error message (for logging/debugging)
   */
  getLastSecureStoreError(): string | null {
    return this.lastSecureStoreError;
  }

  /**
   * Reset temporary error state (call this when user manually logs in)
   */
  resetSecureStoreError(): void {
    this.lastSecureStoreError = null;
    this.secureStoreRetryCount = 0;
  }

  /**
   * Cleanup app state listener
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

export const tokenManager = TokenManager.getInstance();