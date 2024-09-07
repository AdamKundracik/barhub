import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  deleteProfilePicture,
  uploadProfilePhotoAsync,
} from './helperFunctions';
import { auth } from '../../../../firebaseConfig';
import { setUser } from '../services/functions';
import { updateProfile } from 'firebase/auth';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../types/screen-types';

export const openCamera = async () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert(
      'Permission Denied',
      'Permission to access the camera is required.'
    );
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
  });

  if (!result.canceled) {
    await deleteProfilePicture(auth.currentUser?.uid!);
    const uri = await uploadProfilePhotoAsync(result.assets[0].uri);

    await setUser({
      photoURL: uri,
    });

    await updateProfile(auth.currentUser!, {
      photoURL: uri,
      displayName: auth.currentUser?.displayName,
    });
  }
};
