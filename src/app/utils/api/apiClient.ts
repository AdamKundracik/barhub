import { API_CONFIG } from '../../config/api';

// Custom fetch wrapper with automatic token handling
class ApiClient {
  private baseURL: string;
  // Store reference to auth service (set later to avoid circular dependency)
  private getAuthService: (() => any) | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set auth service reference (called from authService after initialization)
  setAuthService(getAuthServiceFn: () => any) {
    this.getAuthService = getAuthServiceFn;
  }

  // Make authenticated request
  async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // For auth endpoints, don't add token
      if (endpoint.startsWith('/auth/')) {
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      }

      // For other endpoints, use authenticated request
      if (this.getAuthService) {
        const authService = this.getAuthService();
        return await authService.makeAuthenticatedRequest(url, options);
      } else {
        // Fallback if authService not set yet (shouldn't happen in practice)
        throw new Error('AuthService not initialized');
      }
    } catch (error) {
      console.error('API request failed:', error);
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
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
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
