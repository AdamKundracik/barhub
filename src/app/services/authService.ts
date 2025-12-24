import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import {
  ClientDTO,
  JwtAuthenticationResponseDTO,
  SignInRequestDTO,
  SignUpRequestDTO,
} from '../types/dto';
import { axiosClient } from '../utils/api/axiosClient';
import { tokenManager } from '../utils/api/tokenManager';
import { logDebug, logInfo, logWarn, logError } from '../utils/store/logsStore';

// Type aliases for better naming
export type LoginCredentials = SignInRequestDTO;
export type RegisterCredentials = SignUpRequestDTO;
export type AuthResponse = JwtAuthenticationResponseDTO;
export type User = ClientDTO;

// Callback types for breaking circular dependency
export type OnUserDataUpdateCallback = (userData: ClientDTO | null) => void;

// Constants
const USER_DATA_KEY = 'user_data';

class AuthService {
  private onUserDataUpdateCallback: OnUserDataUpdateCallback | null = null;

  // Set callback for user data updates (to break circular dependency)
  setUserDataUpdateCallback(callback: OnUserDataUpdateCallback): void {
    this.onUserDataUpdateCallback = callback;
  }

  // Removed initialize() - using lazy token loading instead

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const authResponse: AuthResponse = await axiosClient.post(
        ENDPOINTS.AUTH.SIGNIN,
        credentials
      );

      // Store tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      // Store user data if available
      if (authResponse.user) {
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        );
        // Also update user store via callback
        this.onUserDataUpdateCallback?.(authResponse.user);
      }

      return authResponse;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const authResponse: AuthResponse = await axiosClient.post(
        ENDPOINTS.AUTH.SIGNUP,
        credentials
      );

      // Store tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      // Store user data if available
      if (authResponse.user) {
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        );
        // Also update user store via callback
        this.onUserDataUpdateCallback?.(authResponse.user);

        // Send verification email if user is not verified
        if (!authResponse.user.emailVerified) {
          try {
            // Lazy import to avoid circular dependency
            const { emailVerificationService } = await import(
              './emailVerificationService'
            );
            await emailVerificationService.sendVerificationEmail(
              authResponse.user.email
            );
          } catch (emailError) {
            console.error(
              'AuthService: Failed to send verification email:',
              emailError
            );
            // Don't throw - registration was successful even if email fails
          }
        }
      }

      return authResponse;
    } catch (error) {
      console.error('AuthService: Registration error:', error);
      throw error;
    }
  }

  // Register new user with profile photo
  async registerWithPhoto(
    credentials: RegisterCredentials,
    photoUri: string
  ): Promise<AuthResponse> {
    try {
      // Manipulate image (resize, compress, convert to WEBP)
      const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');
      const manipulatedImage = await manipulateAsync(
        photoUri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: SaveFormat.WEBP }
      );

      // Create FormData
      const formData = new FormData();

      // React Native FormData requires object with uri, type, name (not blob)
      formData.append('profilePhoto', {
        uri: manipulatedImage.uri,
        type: 'image/webp',
        name: 'profile.webp',
      } as any);

      formData.append('name', credentials.name);
      formData.append('email', credentials.email);
      formData.append('password', credentials.password);

      if (credentials.dateOfBirth) {
        // Convert date to ISO string format for backend
        formData.append('dateOfBirth', credentials.dateOfBirth);
      }

      // Add consents as JSON string (FormData can't handle nested objects directly)
      if (credentials.consents) {
        formData.append('consents', JSON.stringify(credentials.consents));
      }

      const authResponse: AuthResponse = await axiosClient
        .getInstance()
        .post(ENDPOINTS.AUTH.SIGNUP_WITH_PHOTO, formData, {
          headers: {
            'Content-Type': undefined,
          },
        });

      // Store tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      // Store user data if available
      if (authResponse.user) {
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        );
        // Also update user store via callback
        this.onUserDataUpdateCallback?.(authResponse.user);

        // Send verification email if user is not verified
        if (!authResponse.user.emailVerified) {
          try {
            // Lazy import to avoid circular dependency
            const { emailVerificationService } = await import(
              './emailVerificationService'
            );
            await emailVerificationService.sendVerificationEmail(
              authResponse.user.email
            );
          } catch (emailError) {
            console.error(
              'AuthService: Failed to send verification email:',
              emailError
            );
            // Don't throw - registration was successful even if email fails
          }
        }
      }

      return authResponse;
    } catch (error) {
      console.error('AuthService: Registration with photo error:', error);
      throw error;
    }
  }

  // Refresh access token with enhanced error handling and recovery
  async refreshAccessToken(): Promise<string | null> {
    console.log('🔄 [REFRESH] Attempting to refresh access token');

    // Get refresh token with better error handling
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      console.log('❌ [REFRESH] No refresh token available');
      return null;
    }

    // Validate refresh token before using it
    if (tokenManager.isTokenExpired(refreshToken)) {
      console.log('❌ [REFRESH] Refresh token is expired');
      await tokenManager.clearTokens();
      return null;
    }

    // Retry logic for network issues
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `📡 [REFRESH] Calling refresh endpoint (attempt ${attempt}/${maxRetries})`
        );
        const authResponse: AuthResponse = await axiosClient.post(
          ENDPOINTS.AUTH.REFRESH,
          { refreshToken }
        );

        console.log('✅ [REFRESH] Refresh endpoint successful');

        // Store new tokens with enhanced error handling
        try {
          await this.storeTokens(authResponse.token, authResponse.refreshToken);
          console.log('✅ [REFRESH] New tokens stored successfully');
        } catch (storeError: any) {
          // Enhanced error handling for token storage failures
          const errorMessage = storeError?.message || String(storeError);

          if (
            errorMessage.includes('User interaction is not allowed') ||
            errorMessage.includes('setValueWithKeyAsync')
          ) {
            console.warn(
              '⚠️ [REFRESH] SecureStore error during token storage - tokens are in memory and functional',
              errorMessage
            );
          } else {
            console.warn(
              '⚠️ [REFRESH] Unexpected error storing tokens - tokens are in memory:',
              errorMessage
            );
          }

          // Verify tokens are actually in memory
          const memoryToken = await tokenManager.getAccessToken();
          if (!memoryToken) {
            console.error(
              '❌ [REFRESH] Tokens not in memory after storage failure!'
            );
            throw new Error('Token storage failed and tokens not in memory');
          }
        }

        // Verify the new token is valid before returning
        if (
          !authResponse.token ||
          tokenManager.isTokenExpired(authResponse.token)
        ) {
          console.error('❌ [REFRESH] Received invalid token from server');
          await tokenManager.clearTokens();
          return null;
        }

        console.log('✅ [REFRESH] Token refresh completed successfully');
        return authResponse.token;
      } catch (error: any) {
        lastError = error;
        console.error(
          `❌ [REFRESH] Token refresh failed (attempt ${attempt}/${maxRetries}):`,
          error
        );

        // Enhanced error classification
        const errorMessage = error?.message || String(error);
        const isNetworkError =
          error?.code === 'NETWORK_ERROR' ||
          error?.message?.includes('Network Error') ||
          error?.message?.includes('timeout') ||
          error?.response?.status >= 500;
        const isSecureStoreError =
          errorMessage.includes('User interaction is not allowed') ||
          errorMessage.includes('setValueWithKeyAsync');
        const isAuthError =
          error?.response?.status === 401 || error?.response?.status === 403;

        // If it's an auth error (401/403), don't retry - refresh token is invalid
        if (isAuthError) {
          console.log(
            '❌ [REFRESH] Authentication error - refresh token is invalid'
          );
          await tokenManager.clearTokens();
          return null;
        }

        // If it's a network error and we have more attempts, retry
        if (isNetworkError && attempt < maxRetries) {
          const delay = attempt * 1000; // Progressive delay: 1s, 2s
          console.log(`⏳ [REFRESH] Network error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }

        // If it's the last attempt or non-retryable error, break
        break;
      }
    }

    // All attempts failed
    console.error('❌ [REFRESH] All refresh attempts failed:', lastError);

    // Enhanced error classification for final decision
    const errorMessage = lastError?.message || String(lastError);
    const isNetworkError =
      lastError?.code === 'NETWORK_ERROR' ||
      lastError?.message?.includes('Network Error') ||
      lastError?.message?.includes('timeout') ||
      lastError?.response?.status >= 500;
    const isSecureStoreError =
      errorMessage.includes('User interaction is not allowed') ||
      errorMessage.includes('setValueWithKeyAsync');
    const isAuthError =
      lastError?.response?.status === 401 || lastError?.response?.status === 403;

    if (isSecureStoreError) {
      // SecureStore error - check if tokens are still in memory
      console.warn(
        '⚠️ [REFRESH] SecureStore error detected - checking memory tokens'
      );
      const tokenFromMemory = tokenManager.getAccessTokenSync();
      if (tokenFromMemory && !tokenManager.isTokenExpired(tokenFromMemory)) {
        console.log('✅ [REFRESH] Using valid token from memory');
        return tokenFromMemory;
      }
    } else if (isNetworkError) {
      // Network error - don't clear tokens, user might be offline
      console.warn(
        '⚠️ [REFRESH] Network error during refresh - keeping tokens'
      );
      const tokenFromMemory = tokenManager.getAccessTokenSync();
      if (tokenFromMemory) {
        console.log(
          'ℹ️ [REFRESH] Returning existing token due to network error'
        );
        return tokenFromMemory;
      }
    } else if (isAuthError) {
      // Authentication error - tokens are invalid
      console.log(
        '🗑️ [REFRESH] Authentication error - clearing invalid tokens'
      );
      await tokenManager.clearTokens();
    } else {
      // Unknown error - be conservative and clear tokens
      console.log('🗑️ [REFRESH] Unknown error - clearing tokens as precaution');
      await tokenManager.clearTokens();
    }

    return null;
  }

  // Get current user data
  // Returns null if user data cannot be fetched
  // Throws error if it's an authentication error (401) - caller should clear auth state
  // Returns null for network/server errors - caller should keep auth state but handle gracefully
  async getCurrentUser(): Promise<User | null> {
    try {
      // Use axiosClient - interceptor will handle token refresh automatically
      const userData: User = await axiosClient.get(ENDPOINTS.USERS.ME);

      // Store user data locally
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

      // Update user store via callback
      this.onUserDataUpdateCallback?.(userData);

      return userData;
    } catch (error: any) {
      console.error('AuthService: Get current user error:', error);
      
      // Check if it's an authentication error (401/403)
      // These mean token is invalid - throw to signal caller to clear auth state
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.error('AuthService: Authentication error (401/403) - token is invalid');
        throw error; // Re-throw auth errors
      }
      
      // For network errors, server errors (500), timeouts, etc.
      // Return null - token might still be valid, just can't fetch user data right now
      console.warn('AuthService: Non-auth error (network/server/timeout) - returning null');
      return null;
    }
  }

  // Get cached user data
  async getCachedUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting cached user:', error);
      return null;
    }
  }

  // Get current access token
  getAccessToken(): string | null {
    return tokenManager.getAccessTokenSync();
  }

  // Simple session validation - the core of authentication
  /**
   * Check if user has a valid session
   * This is the main authentication method - simple and reliable
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      logInfo('authService', 'isAuthenticated called - checking session validity', {
        stackTrace: new Error().stack,
      });

      // Get access token from TokenManager
      const accessToken = await tokenManager.getAccessToken();

      if (!accessToken) {
        logWarn('authService', 'isAuthenticated - No access token available', {
          hasAccessToken: false,
        });
        console.log('[AUTH] No access token available');
        return false;
      }

      logInfo('authService', 'isAuthenticated - Access token found, checking expiration', {
        hasAccessToken: true,
        tokenLength: accessToken.length,
      });

      // If token is not expired, we're authenticated
      if (!tokenManager.isTokenExpired(accessToken)) {
        logInfo('authService', 'isAuthenticated - Access token is valid (not expired)', {
          isExpired: false,
          result: true,
        });
        console.log('[AUTH] Access token is valid');
        return true;
      }

      logWarn('authService', 'isAuthenticated - Access token expired, attempting refresh', {
        isExpired: true,
      });
      console.log('[AUTH] Access token expired, attempting refresh...');

      // Token is expired, try to refresh it
      const newToken = await this.refreshAccessToken();

      if (newToken) {
        logInfo('authService', 'isAuthenticated - Token refresh successful', {
          hasNewToken: true,
          newTokenLength: newToken.length,
          result: true,
        });
        console.log('[AUTH] Token refresh successful, user authenticated');
        return true;
      } else {
        logWarn('authService', 'isAuthenticated - Token refresh failed', {
          hasNewToken: false,
          result: false,
        });
        console.log('[AUTH] Token refresh failed, user not authenticated');
        return false;
      }
    } catch (error) {
      logError(
        'authService',
        'isAuthenticated - Authentication check error',
        {
          errorMessage: error instanceof Error ? error.message : String(error),
          stackTrace: error instanceof Error ? error.stack : undefined,
        },
        error instanceof Error ? error : new Error(String(error))
      );
      console.error('[AUTH] Authentication check error:', error);

      // If there's an error but we have a refresh token, this might be a temporary network issue
      // Don't immediately fail - let the user stay logged in and retry later
      try {
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken && !tokenManager.isTokenExpired(refreshToken)) {
          logInfo(
            'authService',
            'isAuthenticated - Network error but valid refresh token exists, keeping user authenticated',
            {
              hasRefreshToken: true,
              refreshTokenExpired: false,
              result: true,
            }
          );
          console.log(
            '[AUTH] Network error but valid refresh token exists - keeping user authenticated'
          );
          return true; // Keep user authenticated, will retry refresh on next API call
        } else {
          logWarn(
            'authService',
            'isAuthenticated - No valid refresh token available after error',
            {
              hasRefreshToken: !!refreshToken,
              refreshTokenExpired: refreshToken ? tokenManager.isTokenExpired(refreshToken) : null,
              result: false,
            }
          );
        }
      } catch (refreshError) {
        logError(
          'authService',
          'isAuthenticated - Error checking refresh token',
          {
            errorMessage: refreshError instanceof Error ? refreshError.message : String(refreshError),
          },
          refreshError instanceof Error ? refreshError : new Error(String(refreshError))
        );
        console.error('[AUTH] Error checking refresh token:', refreshError);
      }

      return false;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          await axiosClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
        } catch (error) {
          console.error('AuthService: Backend logout failed:', error);
        }
      }

      // Clear tokens
      await tokenManager.clearTokens();

      // Clear user data from user store via callback
      this.onUserDataUpdateCallback?.(null);
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    }
  }

  // Store tokens securely using Expo SecureStore
  // Note: This won't throw if SecureStore fails - tokens will be in memory
  private async storeTokens(
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    try {
      // Store tokens using token manager
      // tokenManager.setTokens() won't throw if SecureStore fails
      // Tokens will be stored in memory and retried later
      await tokenManager.setTokens(accessToken, refreshToken);
    } catch (error) {
      // This should rarely happen now, but if it does, log it
      // Tokens are still in memory, so we can continue
      console.error('Error storing tokens (tokens still in memory):', error);
      // Don't throw - tokens are in memory and will work
    }
  }

  // Forgot password - request reset email
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('AuthService: Forgot password error:', error);
      throw error;
    }
  }

  // Reset password using reset token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.RESET_PASSWORD}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('AuthService: Reset password error:', error);
      throw error;
    }
  }

  // Update password for an authenticated user
  async updatePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const data = await axiosClient.post(ENDPOINTS.AUTH.UPDATE_PASSWORD, {
        oldPassword,
        newPassword,
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('AuthService: Update password error:', error);
      throw error;
    }
  }

  /**
   * Handle social auth response (Google/Apple)
   * Stores tokens and user data
   */
  async handleSocialAuthResponse(authResponse: AuthResponse): Promise<void> {
    try {
      // Store tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      // Store user data if available
      if (authResponse.user) {
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        );
        // Also update user store via callback
        this.onUserDataUpdateCallback?.(authResponse.user);
      }
    } catch (error) {
      console.error('Error handling social auth response:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
