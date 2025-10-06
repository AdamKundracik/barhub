import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  ClientDTO,
  PushTokenRequestDTO,
  SearchHistoryItemEmbeddable,
  UploadLocationRequestDTO,
} from '../types/dto';

// Use exact backend DTO types
export type AppUserData = ClientDTO;

class UserService {
  // Get current user data from backend
  async getCurrentUser(): Promise<AppUserData | null> {
    try {
      return await apiUtils.get<ClientDTO>(ENDPOINTS.USERS.ME);
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Update user data
  async updateUser(
    userId: string,
    updates: Partial<ClientDTO>
  ): Promise<ClientDTO | null> {
    try {
      console.log('[UserService] Updating user:', userId, updates);

      // Convert ClientDTO updates to backend-compatible format
      const backendUpdates: Record<string, any> = {};

      if (updates.name !== undefined) {
        backendUpdates.name = updates.name;
      }

      if (updates.photoUrl !== undefined) {
        backendUpdates.photoUrl = updates.photoUrl;
      }

      if (updates.usingFakeLocation !== undefined) {
        backendUpdates.usingFakeLocation = updates.usingFakeLocation;
      }

      if (updates.dateOfBirth !== undefined) {
        // Convert to ISO string format for backend
        backendUpdates.dateOfBirth = updates.dateOfBirth;
      }

      // Use PATCH method and /users/me endpoint for current user
      const updatedUser = await apiUtils.patch<ClientDTO>(
        ENDPOINTS.USERS.ME,
        backendUpdates
      );

      console.log('[UserService] User updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user profile (name, photo, date of birth)
  async updateProfile(
    userId: string,
    profileData: {
      name?: string;
      photoUrl?: string;
      dateOfBirth?: string;
    }
  ): Promise<ClientDTO | null> {
    try {
      return await this.updateUser(userId, profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Update user photo
  async updatePhoto(
    userId: string,
    photoUrl: string
  ): Promise<ClientDTO | null> {
    try {
      return await this.updateUser(userId, { photoUrl });
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  }

  // Delete user photo
  async deletePhoto(userId: string): Promise<ClientDTO | null> {
    try {
      return await this.updateUser(userId, { photoUrl: undefined });
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Delete current user account
  async deleteCurrentUser(): Promise<boolean> {
    try {
      console.log('[UserService] Deleting current user account');

      await apiUtils.delete(ENDPOINTS.USERS.DELETE_ME);
      console.log('[UserService] User account deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting user account:', error);
      return false;
    }
  }

  // Add push token for user
  async addPushToken(userId: string, token: string): Promise<boolean> {
    try {
      const request: PushTokenRequestDTO = { token };
      await apiUtils.post(ENDPOINTS.USERS.PUSH_TOKENS(userId), request);
      return true;
    } catch (error) {
      console.error('Error adding push token:', error);
      return false;
    }
  }

  // Remove push token for user
  async removePushToken(userId: string, token: string): Promise<boolean> {
    try {
      // Use query parameter instead of request body
      const endpoint = `${ENDPOINTS.USERS.PUSH_TOKENS(userId)}?token=${encodeURIComponent(token)}`;
      await apiUtils.delete(endpoint);
      return true;
    } catch (error) {
      console.error('Error removing push token:', error);
      return false;
    }
  }

  // Get user's push tokens
  async getPushTokens(userId: string): Promise<string[]> {
    try {
      const response = await apiUtils.get<{ tokens: string[] }>(
        ENDPOINTS.USERS.PUSH_TOKENS(userId)
      );
      return response.tokens || [];
    } catch (error) {
      console.error('Error fetching push tokens:', error);
      return [];
    }
  }

  // Update user location
  async updateLocation(
    userId: string,
    location: { latitude: number; longitude: number }
  ): Promise<boolean> {
    try {
      console.log(
        '[UserService] Updating location for user:',
        userId,
        location
      );

      const request: UploadLocationRequestDTO = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      await apiUtils.patch(ENDPOINTS.USERS.LOCATION(userId), request);
      console.log('[UserService] Location updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  }

  // Get user location
  async getLocation(
    userId: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      return await apiUtils.get<{ latitude: number; longitude: number }>(
        ENDPOINTS.USERS.LOCATION(userId)
      );
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  }

  // Add search history item
  async addSearchHistoryItem(
    userId: string,
    item: SearchHistoryItemEmbeddable
  ): Promise<boolean> {
    try {
      await apiUtils.post(ENDPOINTS.USERS.SEARCH_HISTORY(userId), item);
      return true;
    } catch (error) {
      console.error('Error adding search history item:', error);
      return false;
    }
  }

  // Update search history (deprecated - use addSearchHistoryItem instead)
  async updateSearchHistory(
    userId: string,
    searchHistory: SearchHistoryItemEmbeddable[]
  ): Promise<boolean> {
    console.warn(
      'updateSearchHistory is deprecated, use addSearchHistoryItem instead'
    );
    // For backward compatibility, add the first item if array is provided
    if (searchHistory.length > 0) {
      return this.addSearchHistoryItem(userId, searchHistory[0]);
    }
    return false;
  }

  // Get search history
  async getSearchHistory(
    userId: string
  ): Promise<SearchHistoryItemEmbeddable[]> {
    try {
      const response = await apiUtils.get<{
        searchHistory: SearchHistoryItemEmbeddable[];
      }>(ENDPOINTS.USERS.SEARCH_HISTORY(userId));
      return response.searchHistory || [];
    } catch (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const userService = new UserService();
