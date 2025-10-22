import * as SecureStore from 'expo-secure-store';

/**
 * TokenManager - Simple JWT token storage and management
 * 
 * Responsibilities:
 * - Store/retrieve tokens securely using SecureStore
 * - In-memory cache for quick access
 * - Basic token validation (expiration check)
 */
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
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
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('💾 [TOKEN] Storing new tokens');
      
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      
      await Promise.all([
        SecureStore.setItemAsync('accessToken', accessToken),
        SecureStore.setItemAsync('refreshToken', refreshToken)
      ]);
      
      // Log expiration times
      const accessExp = this.getTokenExpiration(accessToken);
      const refreshExp = this.getTokenExpiration(refreshToken);
      if (accessExp) {
        console.log('💾 [TOKEN] Access token expires:', accessExp.toLocaleString());
      }
      if (refreshExp) {
        console.log('💾 [TOKEN] Refresh token expires:', refreshExp.toLocaleString());
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
      
      this.accessToken = null;
      this.refreshToken = null;
      
      await Promise.all([
        SecureStore.deleteItemAsync('accessToken').catch(() => {}),
        SecureStore.deleteItemAsync('refreshToken').catch(() => {})
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
