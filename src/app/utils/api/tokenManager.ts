import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

/**
 * TokenManager - Production-ready JWT token storage and management
 *
 * Design principles:
 * - In-memory cache for performance (fast API requests)
 * - Lazy loading from SecureStore (avoid startup errors)
 * - AppState aware (prevent "User interaction is not allowed" errors)
 * - Automatic retry for failed SecureStore operations
 */
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private pendingTokens: { accessToken: string; refreshToken: string } | null = null;
  private appStateSubscription: any = null;

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
   * App state listener - retry persisting tokens when app becomes active
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && this.pendingTokens) {
          this.retryPersistTokens();
        }
      }
    );
  }

  /**
   * Retry persisting tokens that failed due to SecureStore errors
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
      this.pendingTokens = null;
    } catch (error) {
      console.warn('⚠️ [TOKEN] Retry persist failed, will try again next time:', error);
    }
  }

  /**
   * Generic method to load token with lazy loading and AppState check
   * DRY principle - used by both access and refresh token getters
   */
  private async loadTokenIfNeeded(
    tokenType: 'accessToken' | 'refreshToken'
  ): Promise<string | null> {
    // Return cached token if available (fast path)
    const cachedToken = tokenType === 'accessToken' ? this.accessToken : this.refreshToken;
    if (cachedToken) {
      return cachedToken;
    }

    // Only access SecureStore if app is active
    if (AppState.currentState !== 'active') {
      console.log(`🔒 [TOKEN] App not active, skipping ${tokenType} load`);
      return null;
    }

    // Load from SecureStore (lazy loading)
    try {
      console.log(`📱 [TOKEN] Loading ${tokenType} from SecureStore`);
      const token = await SecureStore.getItemAsync(tokenType);

      // Update cache
      if (tokenType === 'accessToken') {
        this.accessToken = token;
      } else {
        this.refreshToken = token;
      }

      if (token) {
        console.log(`✅ [TOKEN] ${tokenType} loaded from SecureStore`);
      } else {
        console.log(`❌ [TOKEN] No ${tokenType} found in SecureStore`);
      }

      return token;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);

      // Log specific error types
      if (errorMessage.includes('User interaction is not allowed')) {
        console.warn(`⚠️ [TOKEN] SecureStore requires user interaction for ${tokenType}`);
      } else {
        console.error(`❌ [TOKEN] Error loading ${tokenType}:`, errorMessage);
      }

      return null;
    }
  }

  /**
   * Get access token from memory cache (synchronous)
   * Used by axios interceptor where token should already be cached
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get access token with lazy loading from SecureStore (async)
   * Use this for authentication checks and critical operations
   */
  async getAccessTokenAsync(): Promise<string | null> {
    return this.loadTokenIfNeeded('accessToken');
  }

  /**
   * Get refresh token with lazy loading from SecureStore (async)
   */
  async getRefreshToken(): Promise<string | null> {
    return this.loadTokenIfNeeded('refreshToken');
  }

  /**
   * Store tokens in memory and SecureStore
   * If SecureStore fails, tokens are kept in memory and retried later
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('💾 [TOKEN] Storing new tokens');

      // Always update in-memory cache first (critical for immediate use)
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      // Try to persist to SecureStore (non-blocking)
      try {
        await Promise.all([
          SecureStore.setItemAsync('accessToken', accessToken),
          SecureStore.setItemAsync('refreshToken', refreshToken),
        ]);
        console.log('✅ [TOKEN] Tokens stored in SecureStore');
        this.pendingTokens = null; // Clear any pending tokens
      } catch (secureStoreError: any) {
        const errorMessage = secureStoreError?.message || String(secureStoreError);
        console.warn('⚠️ [TOKEN] SecureStore failed, tokens in memory only:', errorMessage);
        
        // Mark tokens as pending for retry when app becomes active
        this.pendingTokens = { accessToken, refreshToken };
      }

      // Log token expiration times for debugging
      try {
        const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
        console.log('📅 [TOKEN] Access token expires:', new Date(accessPayload.exp * 1000).toISOString());
        console.log('📅 [TOKEN] Refresh token expires:', new Date(refreshPayload.exp * 1000).toISOString());
      } catch {
        // Ignore parsing errors
      }
    } catch (error) {
      console.error('❌ [TOKEN] Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Clear all tokens from memory and SecureStore
   */
  async clearTokens(): Promise<void> {
    try {
      console.log('🗑️ [TOKEN] Clearing all tokens');


      // Clear in-memory cache
      this.accessToken = null;
      this.refreshToken = null;
      this.pendingTokens = null;

      // Clear from SecureStore (best effort)
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
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return currentTime >= expirationTime - bufferTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // If we can't parse, consider it expired
    }
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
