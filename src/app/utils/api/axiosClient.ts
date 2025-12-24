import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { AppState, AppStateStatus } from 'react-native';
import { API_CONFIG } from '../../config/api';
import { tokenManager } from './tokenManager';
import { logError, logInfo, logWarn } from '../store/logsStore';

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

        // Try sync access first (if tokens are preloaded)
        let token = tokenManager.getAccessTokenSync();
        
        // If no token in memory, try async load (fallback)
        if (!token) {
          token = await tokenManager.getAccessToken();
        }
        
        if (token && token !== '') {
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
          const errorDetails = {
            url: originalRequest.url,
            method: originalRequest.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data,
            appState: AppState.currentState,
            hasTokensInMemory: tokenManager.hasTokensInMemory(),
            stackTrace: new Error().stack,
          };

          logError(
            'AxiosClient',
            'Refresh token endpoint returned 401 - token is invalid, calling onTokenRefreshFailure',
            errorDetails,
            error instanceof Error ? error : new Error('Refresh token 401')
          );
          console.log('❌ [AUTH] Refresh token je neplatný → okamžitý logout', errorDetails);

          await tokenManager.clearTokens();
          if (this.onTokenRefreshFailure) {
            logInfo(
              'AxiosClient',
              'Calling onTokenRefreshFailure callback',
              {
                callbackExists: !!this.onTokenRefreshFailure,
                stackTrace: new Error().stack,
              }
            );
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
          const requestDetails = {
            url: originalRequest.url,
            method: originalRequest.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data,
            appState: AppState.currentState,
            hasTokensInMemory: tokenManager.hasTokensInMemory(),
            isRefreshing: this.isRefreshing,
            stackTrace: new Error().stack,
          };

          logWarn(
            'AxiosClient',
            '401 Unauthorized detected - attempting token refresh',
            requestDetails
          );
          console.log(
            '🔴 [AUTH] 401 Unauthorized detected',
            originalRequest.url,
            requestDetails
          );

          // Don't attempt refresh if we don't have tokens in memory yet
          if (!tokenManager.hasTokensInMemory()) {
            logWarn(
              'AxiosClient',
              'No tokens in memory yet, skipping refresh',
              requestDetails
            );
            console.log('⏳ [AUTH] No tokens in memory yet, skipping refresh');
            return Promise.reject(error);
          }

          // Check if app is in foreground - SecureStore requires user interaction
          const appState = AppState.currentState;
          if (appState !== 'active') {
            logWarn(
              'AxiosClient',
              'App not in foreground, skipping token refresh',
              { ...requestDetails, appState }
            );
            console.warn(
              '⚠️ [AUTH] App not in foreground, skipping token refresh',
              appState
            );

            // Return original error - don't logout, just fail the request
            // User can retry when app comes to foreground
            return Promise.reject(error);
          }

          // If refresh already running → queue this request
          if (this.isRefreshing) {
            logInfo(
              'AxiosClient',
              'Token refresh already in progress, queuing request',
              requestDetails
            );
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.axiosInstance(originalRequest))
              .catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          logInfo(
            'AxiosClient',
            'Starting token refresh',
            {
              ...requestDetails,
              failedQueueLength: this.failedQueue.length,
            }
          );

          try {
            // dynamic import (prevents circular deps)
            const { authService } = await import('../../services/authService');
            const newToken = await authService.refreshAccessToken();

            if (!newToken) {
              const failureDetails = {
                ...requestDetails,
                refreshResult: 'null',
              };

              logError(
                'AxiosClient',
                'Token refresh returned null token - calling onTokenRefreshFailure',
                failureDetails,
                new Error('Refresh returned null token')
              );
              console.log('❌ [AUTH] Refresh vrátil null token → logout', failureDetails);

              this.processQueue(new Error('Refresh failed'));
              await tokenManager.clearTokens();
              if (this.onTokenRefreshFailure) {
                logInfo(
                  'AxiosClient',
                  'Calling onTokenRefreshFailure callback (null token)',
                  {
                    callbackExists: !!this.onTokenRefreshFailure,
                    stackTrace: new Error().stack,
                  }
                );
                this.onTokenRefreshFailure();
              }

              return Promise.reject(error);
            }

            // success
            logInfo(
              'AxiosClient',
              'Token refresh successful - retrying original request',
              {
                ...requestDetails,
                hasNewToken: !!newToken,
                failedQueueLength: this.failedQueue.length,
              }
            );
            console.log('✅ [AUTH] Refresh OK → retry requests');

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            this.processQueue(null);

            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            const errorMessage = refreshError instanceof Error 
              ? refreshError.message 
              : String(refreshError);
            
            const isSecureStoreError = errorMessage.includes('User interaction is not allowed') ||
              errorMessage.includes('setValueWithKeyAsync');

            if (isSecureStoreError) {
              // Don't logout if it's just a SecureStore error - tokens are in memory
              logWarn(
                'AxiosClient',
                'SecureStore error during refresh, but tokens are in memory - not logging out',
                {
                  ...requestDetails,
                  errorMessage,
                  isSecureStoreError: true,
                }
              );
              console.warn(
                '⚠️ [AUTH] SecureStore error during refresh, but tokens are in memory',
                errorMessage
              );

              // Don't logout - tokens are in memory and will work
              // Just fail this request, user can retry
              this.processQueue(refreshError);
              this.isRefreshing = false;
              return Promise.reject(error);
            }

            // Real auth error - logout
            const failureDetails = {
              ...requestDetails,
              refreshError: errorMessage,
              refreshErrorStack: refreshError instanceof Error ? refreshError.stack : undefined,
              isSecureStoreError: false,
            };

            logError(
              'AxiosClient',
              'Token refresh request failed - calling onTokenRefreshFailure',
              failureDetails,
              refreshError instanceof Error ? refreshError : new Error(String(refreshError))
            );
            console.log(
              '❌ [AUTH] Refresh request error → logout',
              refreshError,
              failureDetails
            );

            this.processQueue(refreshError);
            await tokenManager.clearTokens();
            if (this.onTokenRefreshFailure) {
              logInfo(
                'AxiosClient',
                'Calling onTokenRefreshFailure callback (refresh error)',
                {
                  callbackExists: !!this.onTokenRefreshFailure,
                  errorMessage,
                  stackTrace: new Error().stack,
                }
              );
              this.onTokenRefreshFailure();
            }

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
