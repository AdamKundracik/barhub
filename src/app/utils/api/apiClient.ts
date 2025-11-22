import { API_CONFIG } from '../../config/api';
import { axiosClient } from './axiosClient';

// Custom fetch wrapper with automatic token handling via axiosClient
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Make authenticated request using axiosClient
  async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      // For auth endpoints, use native fetch
      if (endpoint.startsWith('/auth/')) {
        const url = `${this.baseURL}${endpoint}`;
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      }

      // For other endpoints, use axiosClient (handles token refresh automatically)
      const method = options.method?.toLowerCase() || 'get';
      const axiosConfig: any = {
        headers: options.headers,
      };

      // Add body for non-GET requests
      if (options.body && method !== 'get') {
        if (options.body instanceof FormData) {
          axiosConfig.data = options.body;
        } else {
          axiosConfig.data = typeof options.body === 'string' 
            ? JSON.parse(options.body) 
            : options.body;
        }
      }

      const axiosResponse = await axiosClient.getInstance().request({
        url: endpoint,
        method,
        ...axiosConfig,
      });

      // Convert AxiosResponse to fetch Response-like object
      return {
        ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        headers: axiosResponse.headers as any,
        json: async () => axiosResponse.data,
        text: async () => JSON.stringify(axiosResponse.data),
      } as Response;
    } catch (error: any) {
      console.error('API request failed:', error);
      
      // Convert axios error to fetch Response-like object
      if (error.response) {
        return {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as any,
          json: async () => error.response.data,
          text: async () => JSON.stringify(error.response.data),
        } as Response;
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  // POST request
  async post(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  // PATCH request
  async patch(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);

// Helper function for handling API responses
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorCode: string | undefined;
    
    try {
      const errorData = await response.json();
      // Prioritize 'details' for user-friendly messages, fallback to 'message' or 'error'
      errorMessage = errorData.details || errorData.message || errorData.error || errorMessage;
      errorCode = errorData.errorCode;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    // Create enhanced error with additional properties
    const error = new Error(errorMessage) as Error & { 
      errorCode?: string; 
      status?: number;
    };
    error.errorCode = errorCode;
    error.status = response.status;
    
    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
};

// Utility functions for common API patterns
export const apiUtils = {
  // GET with automatic error handling
  async get<T>(endpoint: string): Promise<T> {
    const response = await apiClient.get(endpoint);
    return handleApiResponse<T>(response);
  },

  // POST with automatic error handling
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.post(endpoint, data);
    return handleApiResponse<T>(response);
  },

  // PUT with automatic error handling
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.put(endpoint, data);
    return handleApiResponse<T>(response);
  },

  // DELETE with automatic error handling
  async delete<T>(endpoint: string): Promise<T> {
    const response = await apiClient.delete(endpoint);
    return handleApiResponse<T>(response);
  },

  // PATCH with automatic error handling
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.patch(endpoint, data);
    return handleApiResponse<T>(response);
  },
};
