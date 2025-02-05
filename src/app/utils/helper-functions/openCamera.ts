import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Place } from '../types/types';
import { fetchPlaceDetails } from './fetchPlaceDetail';
import { mapPlaceDetailToPlace } from './mapPlaceDetailToPlace';

export const openCamera = async (
  placeId?: string | null,
  senderToken?: string,
  navigation?: any,
  notificationId?: string
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

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: true,
      aspect: [4, 4],
    });

    if (!result.canceled) {
      if (placeId && senderToken && notificationId) {
        const placeDetail = await fetchPlaceDetails(placeId);
        const place: Place = mapPlaceDetailToPlace(placeDetail);
        navigation.navigate('PostSummary', {
          image: result.assets[0].uri ?? '',
          place: place,
          senderToken: senderToken,
          notificationId: notificationId,
        });
      } else {
        navigation?.navigate('PhotoResolver', { image: result.assets[0].uri });
      }
    }
  } catch (error) {
    console.error('Error opening camera:', error);
    Alert.alert('Error', 'There was an issue accessing the camera.');
  }
};
