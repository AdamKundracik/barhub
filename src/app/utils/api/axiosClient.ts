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
    // Add access token to request
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip token for auth routes
        if (config.url?.startsWith('/auth/')) {
          return config;
        }

        const token = await tokenManager.getAccessTokenAsync();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Handle 401 responses
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const originalRequest = error.config;

        // ❌ Ak refresh endpoint vráti 401 -> okamžitý logout
        if (
          error.response?.status === 401 &&
          originalRequest.url?.includes('/auth/refresh')
        ) {
          console.log('❌ [AUTH] Refresh token je neplatný → okamžitý logout');

          await tokenManager.clearTokens();
          if (this.onTokenRefreshFailure) {
            this.onTokenRefreshFailure();
          }

          return Promise.reject(error);
        }

        // 🔒 Riešenie klasickej 401 (expired access token)
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.startsWith('/auth/')
        ) {
          console.log(
            '🔴 [AUTH] 401 Unauthorized detected',
            originalRequest.url
          );

          // If refresh already running → queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.axiosInstance(originalRequest))
              .catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // dynamic import (prevents circular deps)
            const { authService } = await import('../../services/authService');
            const newToken = await authService.refreshAccessToken();

            if (!newToken) {
              console.log('❌ [AUTH] Refresh vrátil null token → logout');

              this.processQueue(new Error('Refresh failed'));
              await tokenManager.clearTokens();
              if (this.onTokenRefreshFailure) this.onTokenRefreshFailure();

              return Promise.reject(error);
            }

            // success
            console.log('✅ [AUTH] Refresh OK → retry requests');

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            this.processQueue(null);

            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            console.log(
              '❌ [AUTH] Refresh request error → logout',
              refreshError
            );

            this.processQueue(refreshError);
            await tokenManager.clearTokens();
            if (this.onTokenRefreshFailure) this.onTokenRefreshFailure();

            return Promise.reject(error);
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
      error ? reject(error) : resolve();
    });
    this.failedQueue = [];
  }

  // HTTP wrappers
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.axiosInstance.get(url, config);
    return res.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const res = await this.axiosInstance.post(url, data, config);
    return res.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const res = await this.axiosInstance.put(url, data, config);
    return res.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const res = await this.axiosInstance.patch(url, data, config);
    return res.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.axiosInstance.delete(url, config);
    return res.data;
  }

  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  setOnTokenRefreshFailure(callback: (() => void) | null) {
    this.onTokenRefreshFailure = callback;
  }
}

export const axiosClient = new AxiosClient();
export default axiosClient;
