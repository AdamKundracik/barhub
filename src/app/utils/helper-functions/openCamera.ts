import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PlaceDetailsResponse } from '../types/types';
import { useUserContext } from '../../providers/UserProvider';
import { fetchPlaceDetails } from './fetchPlaceDetail';
import { uploadImageAsync, uploadProfilePhotoAsync } from './helperFunctions';
import { useUploadingStateManagement } from '../hooks/useUploadingStateManagement';
import { sendPushNotificationResponse } from '../services/notofications-handler';
import { setUser } from '../services/functions';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../types/screen-types';
import { User } from '../../../../shared';

async function saveImageFromCamera(
  image: string,
  userData: User,
  setUploadingState: any,
  placeId?: string,
  senderToken?: string
): Promise<void> {
  if (!image) {
    console.error('No image');
    return;
  }

  if (placeId && senderToken) {
    const token = userData?.pushToken;
    const place: PlaceDetailsResponse = await fetchPlaceDetails(placeId);
    if (!token) {
      return;
    }
    await uploadImageAsync(
      image,
      setUploadingState,
      placeId,
      place.result.name,
      place.result.formatted_address
    ).then(() => {
      sendPushNotificationResponse(senderToken, placeId).then();
    });
    await setUser({
      lastUploadedPost: new Date().toISOString(),
    });
  }
}

export const openCamera = async (
  userData: User,
  setUploadingState: any,
  placeId?: string | null,
  senderToken?: string,
  navigation?: any
) => {
  try {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Denied',
        'Permission to access the camera is required.'
      );
      return;
    }

    // Launch the camera
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: true,
      aspect: [4, 4],
    });

    if (!result.canceled) {
      if (placeId && senderToken) {
        await saveImageFromCamera(
          result.assets[0].uri,
          userData,
          setUploadingState,
          placeId,
          senderToken
        );
      } else {
        // Navigate to PhotoResolver if no placeId and senderToken
        navigation?.navigate('PhotoResolver', { image: result.assets[0].uri });
      }
    }
  } catch (error) {
    console.error('Error opening camera:', error);
    Alert.alert('Error', 'There was an issue accessing the camera.');
  }
};
