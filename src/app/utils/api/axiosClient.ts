import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from '../../config/api';
import { tokenManager } from './tokenManager';

class AxiosClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

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
        // Debug logging for upload requests
        if (config.url?.includes('/upload') || config.data instanceof FormData) {
          console.log('🔍 [AXIOS DEBUG] Upload request detected:');
          console.log('🔍 [AXIOS DEBUG] URL:', config.url);
          console.log('🔍 [AXIOS DEBUG] Method:', config.method);
          console.log('🔍 [AXIOS DEBUG] Content-Type header:', config.headers['Content-Type']);
          console.log('🔍 [AXIOS DEBUG] Data type:', config.data?.constructor?.name);
          if (config.data instanceof FormData) {
            console.log('🔍 [AXIOS DEBUG] FormData detected - axios should set multipart/form-data');
            // Don't override Content-Type for FormData - let axios handle it
            if (config.headers['Content-Type'] === undefined) {
              console.log('🔍 [AXIOS DEBUG] Content-Type is undefined - axios will set multipart/form-data with boundary');
            }
          }
        }

        // Skip adding token for auth endpoints (except refresh)
        if (config.url?.startsWith('/auth/')) {
          // For refresh endpoint, don't add Authorization header (it uses refresh token in body)
          if (config.url?.includes('/refresh')) {
            console.log('🔄 Refresh endpoint detected - skipping Authorization header');
            return config;
          }
          // For other auth endpoints (login, register, etc.) - skip token
          return config;
        }

        try {
          // FIXED: Use getCurrentAccessToken instead of getValidAccessToken to prevent refresh cycle
          // The response interceptor will handle token refresh on 401 errors
          const token = tokenManager.getAccessToken();
          if (token && !tokenManager.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
          } else if (token) {
            // Token is expired but we have one - let it through, 401 interceptor will handle refresh
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔄 Using expired token - will be refreshed on 401');
          }
        } catch (error) {
          console.error('Error getting token for request:', error);
        }

        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle 401 errors globally
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Debug logging for upload responses
        if (response.config.url?.includes('/upload')) {
          console.log('✅ [AXIOS DEBUG] Upload response received:');
          console.log('✅ [AXIOS DEBUG] Status:', response.status);
          console.log('✅ [AXIOS DEBUG] Headers:', response.headers);
        }
        return response;
      },
      async (error: any) => {
        // Debug logging for upload errors
        if (error.config?.url?.includes('/upload')) {
          console.log('❌ [AXIOS DEBUG] Upload error occurred:');
          console.log('❌ [AXIOS DEBUG] Status:', error.response?.status);
          console.log('❌ [AXIOS DEBUG] Status Text:', error.response?.statusText);
          console.log('❌ [AXIOS DEBUG] Error Data:', error.response?.data);
          console.log('❌ [AXIOS DEBUG] Request Headers:', error.config?.headers);
          console.log('❌ [AXIOS DEBUG] Request Data Type:', error.config?.data?.constructor?.name);
        }
        const originalRequest = error.config;

        // Handle 401 Unauthorized - but skip auth endpoints to prevent infinite loops
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.startsWith('/auth/') &&
          !this.isRefreshing // Additional check to prevent multiple refresh attempts
        ) {
          console.log(
            '🔄 401 Error detected - attempting token refresh for:',
            originalRequest.url
          );
          if (this.isRefreshing) {
            console.log(
              '⏳ Token refresh already in progress - queuing request'
            );
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                // Retry the original request with new token
                return this.axiosInstance(originalRequest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            console.log('🔄 Starting token refresh...');
            // Use authService refresh method to avoid conflicts
            const { authService } = await import('../../services/authService');
            
            // Add timeout to prevent hanging refresh
            const refreshPromise = authService.refreshAccessToken();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Refresh timeout')), 10000)
            );
            
            const newToken = await Promise.race([refreshPromise, timeoutPromise]) as string | null;

            if (newToken) {
              console.log(
                '✅ Token refresh successful - retrying original request'
              );
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              // Process queued requests
              this.processQueue(null);

              // Retry the original request
              return this.axiosInstance(originalRequest);
            } else {
              console.log('❌ Token refresh failed - no new token received');
              console.log('❌ Clearing tokens and rejecting requests');
              // Refresh failed, clear tokens
              this.processQueue(new Error('Token refresh failed'));
              await tokenManager.clearTokens();
              return Promise.reject(new Error('Authentication failed - please login again'));
            }
          } catch (refreshError) {
            console.error('❌ Token refresh error:', refreshError);
            console.log('❌ Clearing tokens due to refresh error');
            this.processQueue(refreshError);
            await tokenManager.clearTokens();
            return Promise.reject(new Error('Authentication failed - please login again'));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

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
}

// Export singleton instance
export const axiosClient = new AxiosClient();
export default axiosClient;
