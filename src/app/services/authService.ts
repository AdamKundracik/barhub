import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import {
  ClientDTO,
  JwtAuthenticationResponseDTO,
  SignInRequestDTO,
  SignUpRequestDTO,
} from '../types/dto';
import { apiClient } from '../utils/api/apiClient';
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

  // Initialize tokens from secure storage
  async initialize(): Promise<void> {
    try {
      await tokenManager.initialize();
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

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
      console.error('Login error:', error);
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
            console.error('Failed to send verification email:', emailError);
            // Don't throw - registration was successful even if email fails
            // User can manually request verification email later
          }
        }
      }

      return authResponse;
    } catch (error) {
      console.error('Registration error:', error);
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

      // Use axiosClient directly for proper multipart/form-data handling
      // Don't set Content-Type manually - let axios set it with boundary

      console.log('🚀 [SIGNUP UPLOAD DEBUG] Starting signup with photo...');
      console.log('🚀 [SIGNUP UPLOAD DEBUG] FormData created with fields:');
      console.log('  - profilePhoto: [FILE] profile.webp');
      console.log('  - name:', credentials.name);
      console.log('  - email:', credentials.email);
      console.log('  - password: [HIDDEN]');
      if (credentials.dateOfBirth) {
        console.log('  - dateOfBirth:', credentials.dateOfBirth);
      }
      if (credentials.consents) {
        console.log('  - consents:', JSON.stringify(credentials.consents));
      }

      const authResponse: AuthResponse = await axiosClient
        .getInstance()
        .post(ENDPOINTS.AUTH.SIGNUP_WITH_PHOTO, formData, {
          headers: {
            // Explicitly set Content-Type to undefined to force axios to set multipart/form-data with boundary
            'Content-Type': undefined,
          },
        });

      console.log('✅ [SIGNUP UPLOAD DEBUG] Signup with photo successful!');

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
            console.error('Failed to send verification email:', emailError);
            // Don't throw - registration was successful even if email fails
            // User can manually request verification email later
          }
        }
      }

      return authResponse;
    } catch (error) {
      console.error('Registration with photo error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      console.log('🔄 [REFRESH DEBUG] Calling refresh endpoint with:');
      console.log('🔄 [REFRESH DEBUG] refreshToken type:', typeof refreshToken);

      const authResponse: AuthResponse = await axiosClient.post(
        ENDPOINTS.AUTH.REFRESH,
        { refreshToken: refreshToken }
      );

      // Store new tokens
      await this.storeTokens(authResponse.token, authResponse.refreshToken);

      return authResponse.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      // await this.logout(); // COMMENTED FOR DEBUGGING
      return null;
    }
  }

  // Get current user data
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await this.getValidAccessToken();
      if (!token) {
        return null;
      }

      // Use axiosClient - interceptor will handle token refresh automatically
      const userData: User = await axiosClient.get(ENDPOINTS.USERS.ME);

      // Store user data locally
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

      // Update user store via callback
      this.onUserDataUpdateCallback?.(userData);

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

  // Get current access token without automatic refresh
  getCurrentAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(): Promise<string | null> {
    const accessToken = tokenManager.getAccessToken();

    if (!accessToken) {
      await this.initialize();
      const refreshedToken = tokenManager.getAccessToken();
      if (!refreshedToken) {
        return null;
      }
    }

    const currentToken = tokenManager.getAccessToken();
    if (!currentToken) {
      return null;
    }

    // Check if token is expired (basic check - you might want to decode JWT)
    if (tokenManager.isTokenExpired(currentToken)) {
      return await this.refreshAccessToken();
    }

    return currentToken;
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
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          await axiosClient.post(ENDPOINTS.AUTH.LOGOUT, {
            refreshToken: refreshToken,
          });
        } catch (error) {
          console.error('Error calling backend logout:', error);
          // Continue with local cleanup even if backend logout fails
        }
      }

      // Clear tokens using token manager
      await tokenManager.clearTokens();

      // Clear user data from user store via callback
      this.onUserDataUpdateCallback?.(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Store tokens securely using Expo SecureStore
  private async storeTokens(
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    try {
      // Store tokens using token manager
      await tokenManager.setTokens(accessToken, refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
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
      // Use axiosClient directly - interceptor will handle token refresh automatically
      const data = await axiosClient.post(ENDPOINTS.AUTH.UPDATE_PASSWORD, {
        oldPassword,
        newPassword,
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Make an authenticated API request using axiosClient
  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      // Extract endpoint from full URL
      const endpoint = url.replace(API_CONFIG.BASE_URL, '');

      // Convert RequestInit to AxiosRequestConfig
      const axiosConfig: any = {
        method: options.method?.toLowerCase() || 'get',
        headers: options.headers,
      };

      // Add body for POST/PUT/PATCH requests
      if (options.body) {
        if (options.body instanceof FormData) {
          axiosConfig.data = options.body;
          delete axiosConfig.headers?.['Content-Type']; // Let axios set it for FormData
        } else {
          axiosConfig.data = options.body;
        }
      }

      // Use axiosClient - interceptor will handle token refresh automatically
      const response = await axiosClient.getInstance().request({
        url: endpoint,
        ...axiosConfig,
      });

      // Convert AxiosResponse to Response-like object
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        json: async () => response.data,
        text: async () => JSON.stringify(response.data),
        redirected: false,
        type: 'basic' as ResponseType,
        url: response.config.url || '',
        clone: () => {
          throw new Error('Clone not supported');
        },
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as unknown as Response;
    } catch (error: any) {
      // Convert axios error to Response-like object
      const status = error.response?.status || 500;
      const statusText = error.response?.statusText || 'Internal Server Error';
      const data = error.response?.data || { message: error.message };

      return {
        ok: false,
        status,
        statusText,
        headers: error.response?.headers || {},
        json: async () => data,
        text: async () => JSON.stringify(data),
        redirected: false,
        type: 'basic' as ResponseType,
        url: error.config?.url || '',
        clone: () => {
          throw new Error('Clone not supported');
        },
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as unknown as Response;
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

// Set authService reference in apiClient to break circular dependency
apiClient.setAuthService(() => authService);
