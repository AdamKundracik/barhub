import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  AddFavoritePlaceRequestDTO,
  FavoritePlaceDTO,
} from '../types/dto';

class FavoriteService {
  // Add place to favorites
  async addFavorite(
    userId: number,
    placeId: string,
    placeName: string,
    placeAddress: string
  ): Promise<{ success: boolean; favorite?: FavoritePlaceDTO; message?: string }> {
    try {
      const request: AddFavoritePlaceRequestDTO = {
        placeId,
        placeName,
        placeAddress,
      };
      
      const favorite = await apiUtils.post<FavoritePlaceDTO>(
        `${ENDPOINTS.FAVORITES.BASE}?userId=${userId}`,
        request
      );
      
      return { success: true, favorite };
    } catch (error: any) {
      console.error('Error adding favorite:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to add favorite',
      };
    }
  }

  // Remove place from favorites
  async removeFavorite(
    userId: number,
    placeId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await apiUtils.delete(
        `${ENDPOINTS.FAVORITES.REMOVE}?userId=${userId}&placeId=${placeId}`
      );
      
      return { success: true };
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to remove favorite',
      };
    }
  }

  // Check if place is favorite
  async isFavorite(
    userId: number,
    placeId: string
  ): Promise<boolean> {
    try {
      const url = `${ENDPOINTS.FAVORITES.CHECK}?userId=${userId}&placeId=${placeId}`;
      const response = await apiUtils.get<{ isFavorite: boolean }>(url);
      
      return response.isFavorite;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  // Get all user favorites
  async getUserFavorites(userId: number): Promise<FavoritePlaceDTO[]> {
    try {
      const favorites = await apiUtils.get<FavoritePlaceDTO[]>(
        `${ENDPOINTS.FAVORITES.BASE}?userId=${userId}`
      );
      
      return favorites;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  // Toggle favorite (convenience method)
  async toggleFavorite(
    userId: number,
    placeId: string,
    placeName: string,
    placeAddress: string,
    isFavorite: boolean
  ): Promise<{ success: boolean; isFavorite: boolean; message?: string; favorite?: FavoritePlaceDTO }> {
    if (isFavorite) {
      // Removing favorite
      const result = await this.removeFavorite(userId, placeId);
      return {
        success: result.success,
        message: result.message,
        isFavorite: result.success ? false : true,
      };
    } else {
      // Adding favorite
      const result = await this.addFavorite(userId, placeId, placeName, placeAddress);
      return {
        success: result.success,
        message: result.message,
        isFavorite: result.success ? true : false,
        favorite: result.favorite,
      };
    }
  }
}

// Export singleton instance
export const favoriteService = new FavoriteService();

