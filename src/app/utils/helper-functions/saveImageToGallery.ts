import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

export interface SaveImageResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Saves an image from URL to device gallery
 * @param imageUrl - URL of the image to save
 * @param filename - Optional filename (will generate one if not provided)
 * @returns Promise<SaveImageResult>
 */
export const saveImageToGallery = async (
  imageUrl: string,
  filename?: string
): Promise<SaveImageResult> => {
  try {
    // Request media library permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access media library is required'
      };
    }

    // Generate filename if not provided
    const finalFilename = filename || `barhub_${Date.now()}.jpg`;
    
    // Download image to temporary directory
    const fileUri = `${FileSystem.documentDirectory}${finalFilename}`;
    
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
    
    if (downloadResult.status !== 200) {
      return {
        success: false,
        error: 'Failed to download image'
      };
    }

    // Save to media library
    const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
    
    // Clean up temporary file
    try {
      await FileSystem.deleteAsync(fileUri);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    // Create album if it doesn't exist (optional)
    try {
      const album = await MediaLibrary.getAlbumAsync('Barhub');
      if (!album) {
        await MediaLibrary.createAlbumAsync('Barhub', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (albumError) {
      console.warn('Failed to add to album, but image was saved:', albumError);
    }

    return {
      success: true,
      message: 'Image saved to gallery successfully'
    };

  } catch (error) {
    console.error('Error saving image to gallery:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Shows alert with save result
 */
export const showSaveResultAlert = (result: SaveImageResult, t: (key: string) => string) => {
  if (result.success) {
    Alert.alert(
      t('saveImage.success'),
      t('saveImage.successMessage'),
      [{ text: t('ok') }]
    );
  } else {
    Alert.alert(
      t('saveImage.error'),
      result.error || t('saveImage.errorMessage'),
      [{ text: t('ok') }]
    );
  }
};
