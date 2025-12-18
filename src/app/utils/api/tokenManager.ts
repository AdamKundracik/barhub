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
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
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
   * App state listener for retry logic
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        // Future: Could add retry logic here if needed
      }
    );
  }

  /**
   * Get access token - loads from SecureStore if not in memory
   * This is the main method for getting tokens
   */
  async getAccessToken(): Promise<string | null> {
    // Return cached token if available and not empty (fast path)
    if (this.accessToken && this.accessToken !== '') {
      return this.accessToken;
    }
    
    // If already tried and failed (empty string), don't retry
    if (this.accessToken === '') {
      return null;
    }

    // Load from SecureStore only once per session
    try {
      console.log('[TOKEN] Loading access token from SecureStore...');
      const token = await SecureStore.getItemAsync('accessToken');
      this.accessToken = token || '';
      console.log('[TOKEN] Access token loaded:', !!token);
      return token;
    } catch (error) {
      console.error('[TOKEN] Error loading access token:', error);
      // Set to empty string to prevent repeated attempts
      this.accessToken = '';
      return null;
    }
  }

  /**
   * Get refresh token - loads from SecureStore if not in memory
   */
  async getRefreshToken(): Promise<string | null> {
    // Return cached token if available and not empty (fast path)
    if (this.refreshToken && this.refreshToken !== '') {
      return this.refreshToken;
    }
    
    // If already tried and failed (empty string), don't retry
    if (this.refreshToken === '') {
      return null;
    }

    // Load from SecureStore only once per session
    try {
      console.log('[TOKEN] Loading refresh token from SecureStore...');
      const token = await SecureStore.getItemAsync('refreshToken');
      this.refreshToken = token || '';
      console.log('[TOKEN] Refresh token loaded:', !!token);
      return token;
    } catch (error) {
      console.error('[TOKEN] Error loading refresh token:', error);
      // Set to empty string to prevent repeated attempts
      this.refreshToken = '';
      return null;
    }
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
        SecureStore.setItemAsync('accessToken', accessToken),
        SecureStore.setItemAsync('refreshToken', refreshToken),
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
        SecureStore.deleteItemAsync('accessToken').catch(() => {}),
        SecureStore.deleteItemAsync('refreshToken').catch(() => {}),
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
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return currentTime >= expirationTime - bufferTime;
    } catch (error) {
      console.error('[TOKEN] Error parsing token:', error);
      return true; // If we can't parse, consider it expired
    }
  }

  /**
   * Preload tokens into memory for faster access
   * Call this during app initialization to avoid delays later
   */
  async preloadTokens(): Promise<boolean> {
    try {
      console.log('[TOKEN] Preloading tokens from SecureStore...');
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
      ]);
      
      this.accessToken = accessToken || '';
      this.refreshToken = refreshToken || '';
      
      const hasValidTokens = !!(accessToken && refreshToken);
      console.log('[TOKEN] Preload complete. Has valid tokens:', hasValidTokens);
      return hasValidTokens;
    } catch (error) {
      console.error('[TOKEN] Error preloading tokens:', error);
      // Set empty strings to prevent repeated attempts
      this.accessToken = '';
      this.refreshToken = '';
      return false;
    }
  }

  /**
   * Check if we have tokens in memory (fast check)
   */
  hasTokensInMemory(): boolean {
    return !!(this.accessToken && this.refreshToken && 
              this.accessToken !== '' && this.refreshToken !== '');
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