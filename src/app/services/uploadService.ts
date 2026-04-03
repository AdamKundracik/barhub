import * as ImageManipulator from 'expo-image-manipulator';
import { ENDPOINTS } from '../config/api';
import { axiosClient } from '../utils/api/axiosClient';

/**
 * Upload Service - handles file uploads using axios directly for proper multipart/form-data support
 */
class UploadService {
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

      // Use axiosClient directly for proper multipart/form-data handling
      // axiosClient will automatically set Content-Type with boundary for FormData

      console.log('🚀 [UPLOAD DEBUG] Starting post upload...');
      console.log('🚀 [UPLOAD DEBUG] FormData created with fields:');
      console.log('  - image: [FILE]', `${postData.fileId}.webp`);
      console.log('  - occupancy:', postData.occupancy);
      console.log('  - userId:', postData.userId);
      console.log('  - placeId:', postData.placeId);
      console.log('  - placeName:', postData.placeName);
      console.log('  - placeAddress:', postData.placeAddress);
      console.log('  - locationLat:', postData.location._lat);
      console.log('  - locationLong:', postData.location._long);
      console.log('  - placeTypes:', postData.placeTypes.join(','));
      console.log('  - isHighlighted: false');
      if (postData.senderToken) {
        console.log('  - senderToken:', postData.senderToken);
      }

      console.log('data', formData);

      const response = await axiosClient.post(
        ENDPOINTS.POSTS.UPLOAD,
        formData,
        {
          headers: {
            // Explicitly set Content-Type to undefined to force axios to set multipart/form-data with boundary
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ [UPLOAD DEBUG] Upload successful!');
      console.log('✅ [UPLOAD DEBUG] Response status:', response.status);

      return response.data; // Backend returns saved post with ID and imageUrl
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

      // Generate timestamp for unique filename
      const timestamp = Date.now();

      // Create FormData
      const formData = new FormData();

      // React Native FormData requires object with uri, type, name (not blob)
      // Include timestamp in filename: userId_timestamp.webp
      formData.append('image', {
        uri: manipulatedImage.uri,
        type: 'image/webp',
        name: `${userId}_${timestamp}.webp`,
      } as any);

      formData.append('userId', userId.toString());
      formData.append('folderId', 'profile_photos'); // Fixed folder for all profile photos

      // Use axiosClient directly for proper multipart/form-data handling

      console.log('🚀 [PROFILE UPLOAD DEBUG] Starting profile photo upload...');
      console.log('🚀 [PROFILE UPLOAD DEBUG] FormData created with fields:');
      console.log('  - image: [FILE]', `${userId}_${timestamp}.webp`);
      console.log('  - userId:', userId);
      console.log('  - folderId: profile_photos');

      const response = await axiosClient
        .getInstance()
        .post(ENDPOINTS.IMAGES.UPLOAD_PROFILE, formData, {
          headers: {
            // Explicitly set Content-Type to undefined to force axios to set multipart/form-data with boundary
            'Content-Type': undefined,
          },
        });

      console.log('✅ [PROFILE UPLOAD DEBUG] Profile upload successful!');
      console.log(
        '✅ [PROFILE UPLOAD DEBUG] Response status:',
        response.status
      );

      return response.data.imageUrl; // Cloudflare image URL
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
      await axiosClient.getInstance().delete(ENDPOINTS.IMAGES.DELETE(imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}

export const uploadService = new UploadService();
