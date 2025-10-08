import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import {
  ClientDTO,
  JwtAuthenticationResponseDTO,
  SignInRequestDTO,
  SignUpRequestDTO,
} from '../types/dto';
import { useUserStore } from '../utils/store/userStore';
import { emailVerificationService } from './emailVerificationService';

// Type aliases for better naming
export type LoginCredentials = SignInRequestDTO;
export type RegisterCredentials = SignUpRequestDTO;
export type AuthResponse = JwtAuthenticationResponseDTO;
export type User = ClientDTO;

// Constants
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  // Initialize tokens from storage
  async initialize(): Promise<void> {
    try {
      this.accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.SIGNIN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const authResponse: AuthResponse = await response.json();

      // Store tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      // Store user data if available
      if (authResponse.user) {
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        );
        // Also update Zustand store
        useUserStore.getState().setUserData(authResponse.user);
      }

      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.SIGNUP}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const authResponse: AuthResponse = await response.json();

      // Store tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      // Store user data if available
      if (authResponse.user) {
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        );
        // Also update Zustand store
        useUserStore.getState().setUserData(authResponse.user);
        
        // Send verification email if user is not verified
        if (!authResponse.user.emailVerified) {
          try {
            await emailVerificationService.sendVerificationEmail(authResponse.user.email);
            console.log('[AuthService] Verification email sent after registration');
          } catch (emailError) {
            console.error('[AuthService] Failed to send verification email:', emailError);
            // Don't throw - registration was successful even if email fails
          }
        }
      }

      return authResponse;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        }
      );

      if (!response.ok) {
        // Refresh token is invalid, logout user
        await this.logout();
        return null;
      }

      const authResponse: AuthResponse = await response.json();

      // Store new tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      return authResponse.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return null;
    }
  }

  // Get current user data
  async getCurrentUser(retryCount = 0): Promise<User | null> {
    console.log(
      `[AuthService] getCurrentUser called, retryCount: ${retryCount}`
    );
    try {
      const token = await this.getValidAccessToken();
      if (!token) {
        console.log('[AuthService] No valid token available');
        return null;
      }

      console.log(
        `[AuthService] Making request to ${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.ME}`
      );
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.ME}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 && retryCount < 1) {
          // Token expired, try to refresh (only once to prevent infinite loop)
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            return this.getCurrentUser(retryCount + 1); // Retry with new token
          }
        }
        throw new Error('Failed to get user data');
      }

      const userData: User = await response.json();

      // Store user data locally
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

      // Update Zustand store
      useUserStore.getState().setUserData(userData);

      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
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

  // Get valid access token (refresh if needed)
  async getValidAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      await this.initialize();
    }

    if (!this.accessToken) {
      return null;
    }

    // Check if token is expired (basic check - you might want to decode JWT)
    if (this.isTokenExpired(this.accessToken)) {
      return await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return !!token;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint to clear Redis data
      if (this.refreshToken) {
        try {
          console.log('[AuthService] Calling backend logout endpoint');
          const response = await fetch(
            `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken: this.refreshToken }),
            }
          );

          if (!response.ok) {
            console.warn(
              '[AuthService] Backend logout failed, continuing with local cleanup'
            );
          } else {
            console.log('[AuthService] Backend logout successful');
          }
        } catch (error) {
          console.error('[AuthService] Error calling backend logout:', error);
          // Continue with local cleanup even if backend logout fails
        }
      }

      // Clear tokens from memory
      this.accessToken = null;
      this.refreshToken = null;

      // Clear tokens from storage
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);

      // Clear user data from Zustand store
      useUserStore.getState().setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Store tokens securely
  private async storeTokens(
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      await AsyncStorage.multiSet([
        [ACCESS_TOKEN_KEY, accessToken],
        [REFRESH_TOKEN_KEY, refreshToken],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  // Basic token expiration check (you might want to use a JWT library for proper decoding)
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      // If we can't decode the token, assume it's expired
      return true;
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
      console.error('Forgot password error:', error);
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
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Update password for an authenticated user
  async updatePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.UPDATE_PASSWORD}`,
        {
          method: 'POST',
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update password');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Make an authenticated API request
  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getValidAccessToken();

    if (!token) {
      throw new Error('No valid access token available');
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, try to refresh token and retry once
    if (response.status === 401) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        const retryHeaders = {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        };

        return fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      }
    }

    return response;
  }
}

// Export singleton instance
export const authService = new AuthService();
