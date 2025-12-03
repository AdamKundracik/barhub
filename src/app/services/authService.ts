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

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    console.log(' [REFRESH] Attempting to refresh access token');

    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      console.log('❌ [REFRESH] No refresh token available');
      return null;
    }

    try {
      console.log(' [REFRESH] Calling refresh endpoint');
      const authResponse: AuthResponse = await axiosClient.post(
        ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      console.log('✅ [REFRESH] Refresh endpoint successful');

      // Store new tokens - this won't throw even if SecureStore fails
      // Tokens will be stored in memory and retried later
      try {
        await this.storeTokens(authResponse.token, authResponse.refreshToken);
        console.log('✅ [REFRESH] New tokens stored successfully');
      } catch (storeError: any) {
        // Even if storing fails (e.g., SecureStore error), tokens are in memory
        // Don't fail the refresh - tokens will work for current session
        const errorMessage = storeError?.message || String(storeError);
        if (
          errorMessage.includes('User interaction is not allowed') ||
          errorMessage.includes('setValueWithKeyAsync')
        ) {
          console.warn(
            '⚠️ [REFRESH] SecureStore error, but tokens are in memory - refresh still successful',
            errorMessage
          );
          // Return token anyway - it's in memory and will work
        } else {
          // Some other error - log but still return token (it's in memory)
          console.warn(
            '⚠️ [REFRESH] Error storing tokens, but they are in memory:',
            errorMessage
          );
        }
      }

      // Return the token even if SecureStore failed - it's in memory
      return authResponse.token;
    } catch (error) {
      console.error('❌ [REFRESH] Token refresh failed:', error);

      // Check if this is a SecureStore error from storing tokens
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isSecureStoreError =
        errorMessage.includes('User interaction is not allowed') ||
        errorMessage.includes('setValueWithKeyAsync');

      if (isSecureStoreError) {
        // SecureStore error - tokens are in memory, don't clear them
        console.warn(
          '⚠️ [REFRESH] SecureStore error, but tokens are in memory - not clearing'
        );
        // Try to get token from memory
        const tokenFromMemory = await tokenManager.getAccessTokenAsync();
        if (tokenFromMemory) {
          console.log('✅ [REFRESH] Using token from memory');
          return tokenFromMemory;
        }
      }

      // Real auth error - clear tokens and logout
      console.log('🗑️ [REFRESH] Clearing tokens due to refresh failure');
      await tokenManager.clearTokens();
      return null;
    }
  }

  // Get current user data
  async getCurrentUser(): Promise<User | null> {
    try {
      // Use axiosClient - interceptor will handle token refresh automatically
      const userData: User = await axiosClient.get(ENDPOINTS.USERS.ME);

      // Store user data locally
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

      // Update user store via callback
      this.onUserDataUpdateCallback?.(userData);

      return userData;
    } catch (error) {
      console.error('AuthService: Get current user error:', error);
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
    return tokenManager.getAccessToken();
  }

  // Check if user is authenticated (has valid token) - now uses lazy loading
  async isAuthenticated(): Promise<boolean> {
    try {
      // Use async token loading to handle SecureStore properly (no more initialize())
      const token = await tokenManager.getAccessTokenAsync();
      if (!token) {
        console.log('❌ [AUTH] No access token available');
        return false;
      }

      if (tokenManager.isTokenExpired(token)) {
        console.log('❌ [AUTH] Access token is expired');
        const newToken = await this.refreshAccessToken();
        return !!newToken;
      }

      console.log('✅ [AUTH] User is authenticated');
      return true;
    } catch (error) {
      console.error('❌ [AUTH] Error checking authentication:', error);
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
