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
  private pendingTokens: { accessToken: string; refreshToken: string } | null =
    null;
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
   * Enhanced with progressive retry logic
   */
  private async retryPersistTokens(): Promise<void> {
    if (!this.pendingTokens) return;

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries && this.pendingTokens) {
      try {
        console.log(`🔄 [TOKEN] Retrying to persist tokens to SecureStore (attempt ${retryCount + 1}/${maxRetries})`);
        
        await Promise.all([
          SecureStore.setItemAsync('accessToken', this.pendingTokens.accessToken),
          SecureStore.setItemAsync('refreshToken', this.pendingTokens.refreshToken),
        ]);
        
        console.log('✅ [TOKEN] Tokens successfully persisted to SecureStore on retry');
        this.pendingTokens = null;
        return; // Success - exit
        
      } catch (error: any) {
        retryCount++;
        const errorMessage = error?.message || String(error);
        
        if (retryCount < maxRetries) {
          const delay = 500 * retryCount; // Progressive delay: 500ms, 1000ms, 1500ms
          console.warn(
            `⚠️ [TOKEN] Retry ${retryCount} failed, waiting ${delay}ms before next attempt:`,
            errorMessage
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.warn(
            '⚠️ [TOKEN] All retry attempts failed, will try again on next app activation:',
            errorMessage
          );
        }
      }
    }
  }

  /**
   * Generic method to load token with lazy loading and intelligent AppState handling
   * DRY principle - used by both access and refresh token getters
   */
  private async loadTokenIfNeeded(
    tokenType: 'accessToken' | 'refreshToken',
    forInitialization: boolean = false
  ): Promise<string | null> {
    // Return cached token if available (fast path)
    const cachedToken =
      tokenType === 'accessToken' ? this.accessToken : this.refreshToken;
    if (cachedToken) {
      return cachedToken;
    }

    // Smart AppState handling for physical devices
    const currentState = AppState.currentState;
    const shouldSkipSecureStore = !forInitialization && 
      currentState !== 'active' && 
      currentState !== 'inactive'; // Allow 'inactive' state for app startup

    if (shouldSkipSecureStore) {
      console.log(
        `🔒 [TOKEN] App in background (${currentState}), skipping ${tokenType} load`
      );
      return null;
    }

    // Load from SecureStore (lazy loading)
    try {
      console.log(
        `📱 [TOKEN] Loading ${tokenType} from SecureStore (AppState: ${currentState}, forInit: ${forInitialization})`
      );
      
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

      // Handle specific error types with better recovery
      if (errorMessage.includes('User interaction is not allowed')) {
        console.warn(
          `⚠️ [TOKEN] SecureStore requires user interaction for ${tokenType} (AppState: ${currentState})`
        );
        
        // During initialization, try to wait and retry once
        if (forInitialization) {
          console.log(`🔄 [TOKEN] Retrying ${tokenType} load after brief delay...`);
          await new Promise(resolve => setTimeout(resolve, 100));
          try {
            const retryToken = await SecureStore.getItemAsync(tokenType);
            if (retryToken) {
              if (tokenType === 'accessToken') {
                this.accessToken = retryToken;
              } else {
                this.refreshToken = retryToken;
              }
              console.log(`✅ [TOKEN] ${tokenType} loaded on retry`);
              return retryToken;
            }
          } catch (retryError) {
            console.warn(`⚠️ [TOKEN] Retry failed for ${tokenType}:`, retryError);
          }
        }
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
   * @param forInitialization - Set to true during app initialization for better compatibility
   */
  async getAccessTokenAsync(
    forInitialization: boolean = false
  ): Promise<string | null> {
    return this.loadTokenIfNeeded('accessToken', forInitialization);
  }

  /**
   * Get refresh token with lazy loading from SecureStore (async)
   * @param forInitialization - Set to true during app initialization for better compatibility
   */
  async getRefreshToken(
    forInitialization: boolean = false
  ): Promise<string | null> {
    return this.loadTokenIfNeeded('refreshToken', forInitialization);
  }

  /**
   * Store tokens in memory and SecureStore with enhanced error handling
   * If SecureStore fails, tokens are kept in memory and retried later
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('💾 [TOKEN] Storing new tokens');

      // Always update in-memory cache first (critical for immediate use)
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      // Try to persist to SecureStore with enhanced retry logic
      const maxRetries = 2;
      let retryCount = 0;
      let lastError: any = null;

      while (retryCount <= maxRetries) {
        try {
          await Promise.all([
            SecureStore.setItemAsync('accessToken', accessToken),
            SecureStore.setItemAsync('refreshToken', refreshToken),
          ]);
          console.log('✅ [TOKEN] Tokens stored in SecureStore');
          this.pendingTokens = null; // Clear any pending tokens
          break; // Success - exit retry loop
        } catch (secureStoreError: any) {
          lastError = secureStoreError;
          const errorMessage = secureStoreError?.message || String(secureStoreError);
          
          if (retryCount < maxRetries && 
              (errorMessage.includes('User interaction is not allowed') || 
               errorMessage.includes('setValueWithKeyAsync'))) {
            retryCount++;
            console.log(`🔄 [TOKEN] SecureStore retry ${retryCount}/${maxRetries} after brief delay`);
            await new Promise(resolve => setTimeout(resolve, 200 * retryCount)); // Progressive delay
            continue;
          }
          
          // Max retries reached or non-recoverable error
          console.warn(
            '⚠️ [TOKEN] SecureStore failed after retries, tokens in memory only:',
            errorMessage
          );
          
          // Mark tokens as pending for retry when app becomes active
          this.pendingTokens = { accessToken, refreshToken };
          break;
        }
      }

      // Log token expiration times for debugging (enhanced)
      try {
        const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
        const now = new Date();
        const accessExpiry = new Date(accessPayload.exp * 1000);
        const refreshExpiry = new Date(refreshPayload.exp * 1000);
        
        console.log('📅 [TOKEN] Access token expires:', accessExpiry.toISOString(), 
                   `(in ${Math.round((accessExpiry.getTime() - now.getTime()) / 60000)} minutes)`);
        console.log('📅 [TOKEN] Refresh token expires:', refreshExpiry.toISOString(),
                   `(in ${Math.round((refreshExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} days)`);
      } catch (parseError) {
        console.warn('⚠️ [TOKEN] Could not parse token expiration times:', parseError);
      }
    } catch (error) {
      console.error('❌ [TOKEN] Critical error storing tokens:', error);
      // Don't throw - tokens are in memory and will work for current session
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
