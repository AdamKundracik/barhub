import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from '../../config/api';
import { tokenManager } from './tokenManager';

/**
 * AxiosClient - HTTP client with automatic JWT token refresh
 * 
 * Key features:
 * - Automatic token injection in request headers
 * - 401 error interceptor with automatic token refresh
 * - Request queuing during token refresh
 * - Prevents infinite refresh loops
 * - Automatic logout on token refresh failure
 */
class AxiosClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];
  private onTokenRefreshFailure: (() => void) | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip token for auth endpoints
        if (config.url?.startsWith('/auth/')) {
          return config;
        }

        // Get access token with fallback to SecureStore
        const token = await tokenManager.getAccessTokenAsync();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor - handle 401 errors
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.startsWith('/auth/')
        ) {
          console.log('🔴 [AUTH] 401 Unauthorized detected');
          console.log('🔴 [AUTH] Request:', originalRequest.method?.toUpperCase(), originalRequest.url);
          
          // If already refreshing, queue this request
          if (this.isRefreshing) {
            console.log('⏳ [AUTH] Token refresh already in progress, queuing request');
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                console.log('✅ [AUTH] Retrying queued request after refresh');
                return this.axiosInstance(originalRequest);
              })
              .catch(err => {
                console.log('❌ [AUTH] Queued request failed after refresh');
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;
          console.log('🔄 [AUTH] Starting token refresh process...');

          try {
            // Dynamic import to avoid circular dependency
            const { authService } = await import('../../services/authService');
            const newToken = await authService.refreshAccessToken();

            if (newToken) {
              console.log('✅ [AUTH] Token refresh successful');
              console.log('✅ [AUTH] Retrying original request with new token');
              
              // Update original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Retry all queued requests
              console.log(`✅ [AUTH] Processing ${this.failedQueue.length} queued requests`);
              this.processQueue(null);
              
              // Retry original request
              return this.axiosInstance(originalRequest);
            } else {
              console.log('❌ [AUTH] Token refresh failed - no new token received');
              console.log('🗑️ [AUTH] Clearing tokens and triggering logout');
              
              // Refresh failed - clear tokens and logout
              this.processQueue(new Error('Token refresh failed'));
              await tokenManager.clearTokens();
              
              // Trigger logout callback if set
              if (this.onTokenRefreshFailure) {
                console.log('🚪 [AUTH] Triggering logout due to token refresh failure');
                this.onTokenRefreshFailure();
              }
              
              return Promise.reject(error);
            }
          } catch (refreshError) {
            console.log('❌ [AUTH] Token refresh error:', refreshError);
            console.log('🗑️ [AUTH] Clearing tokens due to refresh error');
            
            // Refresh failed - clear tokens and logout
            this.processQueue(refreshError);
            await tokenManager.clearTokens();
            
            // Trigger logout callback if set
            if (this.onTokenRefreshFailure) {
              console.log('🚪 [AUTH] Triggering logout due to token refresh error');
              this.onTokenRefreshFailure();
            }
            
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
            console.log('🔄 [AUTH] Token refresh process completed');
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    this.failedQueue = [];
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  // Get the underlying axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Set callback for token refresh failure
  setOnTokenRefreshFailure(callback: (() => void) | null) {
    this.onTokenRefreshFailure = callback;
  }
}

// Export singleton instance
export const axiosClient = new AxiosClient();
export default axiosClient;
