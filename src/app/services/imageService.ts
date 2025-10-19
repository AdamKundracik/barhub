import { uploadService } from './uploadService';

/**
 * Image Service - wrapper around uploadService for backward compatibility
 * @deprecated Use uploadService directly for new code
 */
class ImageService {
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
    return uploadService.uploadPostImage(uri, postData);
  }

  /**
   * Upload profile photo to Cloudflare
   * Uploads to 'profile_photos' folder with userId as fileId
   * @param uri - Local image URI
   * @param userId - User ID (will be used as fileId)
   * @returns Cloudflare image URL
   */
  async uploadProfilePhoto(uri: string, userId: number): Promise<string> {
    return uploadService.uploadProfilePhoto(uri, userId);
  }

  /**
   * Delete image from Cloudflare (via backend)
   * @param imageId - Cloudflare image ID
   */
  async deleteImage(imageId: string): Promise<void> {
    return uploadService.deleteImage(imageId);
  }
}

export const imageService = new ImageService();
