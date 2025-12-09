import { httpClient } from '../utils/api/httpClient';
import { ENDPOINTS } from '../config/api';
import {
  BlockedUserDTO,
  ClientDTO,
  PushTokenRequestDTO,
  RoleEnum,
  SearchHistoryItemEmbeddable,
  UploadCheckResponseDTO,
  UploadLocationRequestDTO,
  UserProfileDTO,
} from '../types/dto';

// Use exact backend DTO types
export type AppUserData = ClientDTO;

class UserService {
  // Get current user data from backend
  async getCurrentUser(): Promise<AppUserData | null> {
    try {
      return await httpClient.get<ClientDTO>(ENDPOINTS.USERS.ME);
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

      if (updates.bio !== undefined) {
        backendUpdates.bio = updates.bio;
      }

      // ADD THIS: Premium field mapping
      if (updates.premium !== undefined) {
        backendUpdates.premium = updates.premium;
      }

      return await httpClient.patch<ClientDTO>(
        ENDPOINTS.USERS.ME,
        backendUpdates
      );
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
      // Send null to backend to clear the photoUrl
      return await this.updateUser(userId, { photoUrl: null as any });
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Update user bio
  async updateBio(bio: string): Promise<ClientDTO | null> {
    try {
      const { useUserStore } = await import('../utils/store/userStore');
      const userId = useUserStore.getState().getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      return await this.updateUser(userId, { bio });
    } catch (error) {
      console.error('Error updating bio:', error);
      throw error;
    }
  }

  // Mark tutorial as viewed
  async markTutorialAsViewed(): Promise<void> {
    try {
      await httpClient.put(ENDPOINTS.USERS.TUTORIAL_VIEWED);
    } catch (error) {
      console.error('Error marking tutorial as viewed:', error);
      throw error;
    }
  }

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfileDTO | null> {
    try {
      const profile = await httpClient.get<UserProfileDTO>(ENDPOINTS.USERS.PROFILE(userId));
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Delete current user account
  async deleteCurrentUser(): Promise<boolean> {
    try {
      await httpClient.delete(ENDPOINTS.USERS.DELETE_ME);
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
      await httpClient.post(ENDPOINTS.USERS.PUSH_TOKENS(userId), request);
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
      await httpClient.delete(endpoint);
      return true;
    } catch (error) {
      console.error('Error removing push token:', error);
      return false;
    }
  }

  // Get user's push token (single token, not array)
  async getPushToken(userId: string): Promise<string | null> {
    try {
      const response = await httpClient.get<{ token: string | null }>(
        ENDPOINTS.USERS.PUSH_TOKENS(userId)
      );
      return response.token || null;
    } catch (error) {
      console.error('Error fetching push token:', error);
      return null;
    }
  }

  // Update user location
  async updateLocation(
    userId: string,
    location: { latitude: number; longitude: number }
  ): Promise<boolean> {
    try {
      const request: UploadLocationRequestDTO = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      await httpClient.patch(ENDPOINTS.USERS.LOCATION(userId), request);
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
      return await httpClient.get<{ latitude: number; longitude: number }>(
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
      await httpClient.post(ENDPOINTS.USERS.SEARCH_HISTORY(userId), item);
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
      const response = await httpClient.get<{
        searchHistory: SearchHistoryItemEmbeddable[];
      }>(ENDPOINTS.USERS.SEARCH_HISTORY(userId));
      return response.searchHistory || [];
    } catch (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
  }

  // Admin functions
  async getAllUsers(): Promise<ClientDTO[]> {
    try {
      const users = await httpClient.get<ClientDTO[]>('/users');
      return users || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, role: RoleEnum): Promise<boolean> {
    try {
      await httpClient.patch(`/admin/users/${userId}/role`, {
        role: role.toString(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async updateUserDisabledStatus(
    userId: number,
    disabled: boolean
  ): Promise<boolean> {
    try {
      await httpClient.patch(`/admin/users/${userId}/disabled`, { disabled });
      return true;
    } catch (error) {
      console.error('Error updating user disabled status:', error);
      throw error;
    }
  }

  async updateUserPremium(userId: number, premium: boolean): Promise<boolean> {
    try {
      await httpClient.patch(`/admin/users/${userId}/premium`, { premium });
      return true;
    } catch (error) {
      console.error('Error updating user premium status:', error);
      throw error;
    }
  }

  // Block user
  async blockUser(userId: string): Promise<boolean> {
    try {
      await httpClient.post(ENDPOINTS.USERS.BLOCK(userId));
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  // Unblock user
  async unblockUser(userId: string): Promise<boolean> {
    try {
      await httpClient.delete(ENDPOINTS.USERS.UNBLOCK(userId));
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  // Get blocked users
  async getBlockedUsers(): Promise<BlockedUserDTO[]> {
    try {
      const response = await httpClient.get<BlockedUserDTO[]>(ENDPOINTS.USERS.BLOCKED_USERS);
      // Ensure we always return an array
      if (Array.isArray(response)) {
        return response;
      }
      // If response is not an array, return empty array
      console.warn('getBlockedUsers: Response is not an array:', response);
      return [];
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return [];
    }
  }

  // Check if user can upload a new post (5-minute cooldown)
  async canUploadPost(): Promise<UploadCheckResponseDTO> {
    try {
      const response = await httpClient.get<UploadCheckResponseDTO>(ENDPOINTS.USERS.CAN_UPLOAD);
      return response;
    } catch (error) {
      console.error('Error checking upload permission:', error);
      // Return default response on error
      return {
        canUpload: false,
        remainingSeconds: 0,
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService();
