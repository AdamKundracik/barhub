import { axiosClient } from './axiosClient';

/**
 * Universal HTTP client that uses Axios with automatic JWT token refresh
 * This should be used throughout the app instead of direct fetch calls
 */
export class HttpClient {
  /**
   * GET request
   */
  static async get<T = any>(endpoint: string, config?: any): Promise<T> {
    return axiosClient.get<T>(endpoint, config);
  }

  /**
   * POST request
   */
  static async post<T = any>(endpoint: string, data?: any, config?: any): Promise<T> {
    return axiosClient.post<T>(endpoint, data, config);
  }

  /**
   * PUT request
   */
  static async put<T = any>(endpoint: string, data?: any, config?: any): Promise<T> {
    return axiosClient.put<T>(endpoint, data, config);
  }

  /**
   * PATCH request
   */
  static async patch<T = any>(endpoint: string, data?: any, config?: any): Promise<T> {
    return axiosClient.patch<T>(endpoint, data, config);
  }

  /**
   * DELETE request
   */
  static async delete<T = any>(endpoint: string, config?: any): Promise<T> {
    return axiosClient.delete<T>(endpoint, config);
  }

  /**
   * Upload file with FormData
   */
  static async upload<T = any>(endpoint: string, formData: FormData, config?: any): Promise<T> {
    return axiosClient.post<T>(endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  static getInstance() {
    return axiosClient.getInstance();
  }
}

// Export singleton instance for convenience
export const httpClient = HttpClient;
export default httpClient;
