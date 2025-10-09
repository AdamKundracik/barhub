import * as ImageManipulator from 'expo-image-manipulator';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { authService } from './authService';

/**
 * Image Service - handles image uploads to backend (which then uploads to Cloudflare)
 */
class ImageService {
  /**
   * Manipulate image - resize and compress
   */
  private async manipulateImage(uri: string): Promise<{ uri: string }> {
    const width = 720;
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
    );
  }

  /**
   * Upload post image and save post to DB
   * @param uri - Local image URI
   * @param postData - Complete post data (location, place info, occupancy, etc.)
   * @returns Saved post with ID from backend
   */
  async uploadPostImage(
    uri: string,
    postData: {
      userId: number;
      placeId: string;
      fileId: string;
      location: { _lat: number; _long: number };
      placeTypes: string[];
      occupancy: string;
      placeName: string;
      placeAddress: string;
      senderToken?: string;
    }
  ): Promise<any> {
    try {
      // Manipulate image
      const manipulatedImage = await this.manipulateImage(uri);

      // Create FormData
      const formData = new FormData();

      // Image file
      formData.append('image', {
        uri: manipulatedImage.uri,
        type: 'image/webp',
        name: `${postData.fileId}.webp`,
      } as any);

      // Post data - match backend parameter names
      formData.append('occupancy', postData.occupancy);
      formData.append('userId', postData.userId.toString());
      formData.append('placeId', postData.placeId);
      formData.append('placeName', postData.placeName);
      formData.append('placeAddress', postData.placeAddress);

      // Location as separate lat/long fields
      formData.append('locationLat', postData.location._lat.toString());
      formData.append('locationLong', postData.location._long.toString());

      // placeTypes as comma-separated string
      formData.append('placeTypes', postData.placeTypes.join(','));

      // Optional parameters
      formData.append('isHighlighted', 'false');

      if (postData.senderToken) {
        formData.append('senderToken', postData.senderToken);
      }

      // Upload to backend (Cloudflare) - backend saves post to DB
      const uploadResponse = await authService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.POSTS.UPLOAD}`,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Failed to upload image and save post'
        );
      }

      const data = await uploadResponse.json();
      return data; // Backend returns saved post with ID and imageUrl
    } catch (error) {
      console.error('Error uploading post image:', error);
      throw error;
    }
  }

  /**
   * Upload profile photo to Cloudflare
   * Uploads to 'profile_photos' folder with userId as fileId
   * @param uri - Local image URI
   * @param userId - User ID (will be used as fileId)
   * @returns Cloudflare image URL
   */
  async uploadProfilePhoto(uri: string, userId: number): Promise<string> {
    try {
      // Manipulate image (resize, compress, convert to WEBP)
      const manipulatedImage = await this.manipulateImage(uri);

      // Create FormData
      const formData = new FormData();

      // React Native FormData requires object with uri, type, name (not blob)
      formData.append('image', {
        uri: manipulatedImage.uri,
        type: 'image/webp',
        name: `${userId}.webp`,
      } as any);

      formData.append('userId', userId.toString());
      formData.append('folderId', 'profile_photos'); // Fixed folder for all profile photos

      // Upload to backend (Cloudflare) - backend also updates user.photoUrl in DB
      const uploadResponse = await authService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.IMAGES.UPLOAD_PROFILE}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            'Failed to upload profile photo'
        );
      }

      const data = await uploadResponse.json();
      return data.imageUrl; // Cloudflare image URL
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudflare (via backend)
   * @param imageId - Cloudflare image ID
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.IMAGES.DELETE(imageId)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService();
