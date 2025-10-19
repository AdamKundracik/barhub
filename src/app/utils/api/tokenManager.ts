import * as SecureStore from 'expo-secure-store';

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

  async initialize(): Promise<void> {
    try {
      this.accessToken = await SecureStore.getItemAsync('accessToken');
      this.refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      // Log token expiration info
      if (this.accessToken) {
        const accessTokenExp = this.getTokenExpiration(this.accessToken);
        if (accessTokenExp) {
          console.log('🔑 Access token expires at:', accessTokenExp.toLocaleString());
        }
      }
      
      if (this.refreshToken) {
        const refreshTokenExp = this.getTokenExpiration(this.refreshToken);
        if (refreshTokenExp) {
          console.log('🔄 Refresh token expires at:', refreshTokenExp.toLocaleString());
        }
      }
    } catch (error) {
      console.error('Error initializing token manager:', error);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    console.log('🔍 getRefreshToken called - memory cache:', {
      hasRefreshToken: !!this.refreshToken,
      tokenLength: this.refreshToken?.length,
    });
    
    // If not in memory cache, try to load from SecureStore
    if (!this.refreshToken) {
      console.log('🔄 Refresh token not in memory - loading from SecureStore');
      try {
        this.refreshToken = await SecureStore.getItemAsync('refreshToken');
        console.log('🔍 Loaded from SecureStore:', {
          hasRefreshToken: !!this.refreshToken,
          tokenLength: this.refreshToken?.length,
        });
      } catch (error) {
        console.error('Error loading refresh token from SecureStore:', error);
      }
    }
    
    return this.refreshToken;
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      
      // Log new token expiration info
      const accessTokenExp = this.getTokenExpiration(accessToken);
      const refreshTokenExp = this.getTokenExpiration(refreshToken);
      
      if (accessTokenExp) {
        console.log('🔑 New access token expires at:', accessTokenExp.toLocaleString());
      }
      if (refreshTokenExp) {
        console.log('🔄 New refresh token expires at:', refreshTokenExp.toLocaleString());
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      console.log('🗑️ clearTokens() called - clearing all tokens');
      
      // Get call stack info
      const stack = new Error().stack;
      console.log('Call stack:', stack);
      
      this.accessToken = null;
      this.refreshToken = null;
      
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      
      console.log('✅ Tokens cleared successfully');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }
}

export const tokenManager = TokenManager.getInstance();
