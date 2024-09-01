import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Layout from '../../components/user/Shared/Layout';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import SlidingView from '../../components/shared/SlidingView';
import * as ImagePicker from 'expo-image-picker';
import {
  deleteProfilePicture,
  uploadProfilePhotoAsync,
} from '../../utils/helper-functions/helperFunctions';
import { setUser } from '../../utils/services/functions';
import { useUserContext } from '../../providers/UserProvider';
import { DeleteUserModal } from '../../components/user/Account/DeleteUserModal';

export const Account = () => {
  const { userData } = useUserContext();
  const { t } = useTranslation();
  const [isSlidingViewVisible, setSlidingViewVisible] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        Alert.alert(t('Signed out'), t('You have been signed out'), [
          { text: 'Ok' },
        ]);
      })
      .catch(error => {
        console.error(error);
      });
  };

  const toggleOpenOptions = () => {
    setSlidingViewVisible(!isSlidingViewVisible);
  };

  const handleOutsideClick = () => {
    if (isSlidingViewVisible) {
      setSlidingViewVisible(false);
    }
  };

  const openGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Denied',
        'Permission to access the gallery is required.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = await uploadProfilePhotoAsync(result.assets[0].uri);

      await setUser({
        photoURL: uri,
      });

      await updateProfile(auth.currentUser!, {
        photoURL: uri,
      });

      setSlidingViewVisible(false); // Close the sliding view after the action
    }
  };

  const openCamera = async () => {
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
      const uri = await uploadProfilePhotoAsync(result.assets[0].uri);

      await setUser({
        photoURL: uri,
      });

      await updateProfile(auth.currentUser!, {
        photoURL: uri,
        displayName: auth.currentUser?.displayName,
      });

      setSlidingViewVisible(false); // Close the sliding view after the action
    }
  };

  const removePicture = async () => {
    await deleteProfilePicture(auth.currentUser?.uid!);
    await setUser({
      photoURL: '',
    });

    await updateProfile(auth.currentUser!, {
      photoURL: '',
      displayName: auth.currentUser?.displayName,
    });
  };

  return (
    <Layout pageTitle="Account">
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <View style={styles.container}>
          <TouchableOpacity onPress={toggleOpenOptions}>
            <Image
              source={
                auth.currentUser?.photoURL
                  ? { uri: auth.currentUser.photoURL }
                  : require('../../../../assets/userIcon.png')
              }
              style={styles.profilePicture}
            />
          </TouchableOpacity>
          <Text style={styles.userName}>{auth.currentUser?.displayName}</Text>
          <Text style={styles.userName}>{auth.currentUser?.email}</Text>
          {userData?.premium && (
            <Text style={styles.picturesTaken}>PREMIUM MEMBER</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.buttonText}>
              Settings <FontAwesomeIcon icon={Icons.Gear} color="white" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setModalOpened(true)}
          >
            <Text style={{ color: 'red' }}>Delete user</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
      <SlidingView
        visible={isSlidingViewVisible}
        onClose={() => setSlidingViewVisible(false)}
        openGallery={openGallery}
        openCamera={openCamera}
        removePicture={removePicture}
      />
      <DeleteUserModal
        isOpen={modalOpened}
        onClose={() => setModalOpened(false)}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
  },
  picturesTaken: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default Account;
