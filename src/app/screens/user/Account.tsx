import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Layout from '../../components/user/Shared/Layout';
import { updateProfile } from 'firebase/auth';
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
import FastImage from 'react-native-fast-image';
import { primaryColor } from '../../utils/styles/colors';

export const Account = () => {
  const { userData, fetchUserData, fetchAllUsers } = useUserContext();
  const { t } = useTranslation();
  const [isSlidingViewVisible, setSlidingViewVisible] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  const navigation = useNavigation<NavigationProp<UserStackList>>();

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
      allowsEditing: true,
      aspect: [4, 4],
    });

    if (!result.canceled) {
      const uri = await uploadProfilePhotoAsync(result.assets[0].uri);

      await setUser({
        photoURL: uri,
      });

      await updateProfile(auth.currentUser!, {
        photoURL: uri,
      });

      if (fetchUserData) await fetchUserData();
      if (fetchAllUsers) await fetchAllUsers();

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
      allowsEditing: true,
      aspect: [4, 4],
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
      if (fetchUserData) await fetchUserData();
      if (fetchAllUsers) await fetchAllUsers();

      setSlidingViewVisible(false); // Close the sliding view after the action
    }
  };

  const removePicture = async () => {
    if (auth.currentUser?.providerId !== 'google.com') {
      await deleteProfilePicture(auth.currentUser?.uid!);
    }
    await setUser({
      photoURL: '',
    });

    await updateProfile(auth.currentUser!, {
      photoURL: '',
      displayName: auth.currentUser?.displayName,
    });
    if (fetchUserData) await fetchUserData();
    if (fetchAllUsers) await fetchAllUsers();
    setSlidingViewVisible(false); // Close the sliding view after the action
  };

  return (
    <Layout pageTitle="Account" showBottomTabs={false}>
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon={Icons.Remove} size={24} color={'white'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon={Icons.Pencil} size={16} color={'white'} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={toggleOpenOptions}>
              <FastImage
                source={
                  auth.currentUser?.photoURL
                    ? { uri: auth.currentUser.photoURL }
                    : require('../../../../assets/userIcon.png')
                }
                style={[
                  styles.profilePicture,
                  userData?.premium && {
                    borderWidth: 1,
                    borderColor: '#FFC107',
                  },
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.username}>{auth.currentUser?.displayName}</Text>
            <Text style={{ color: primaryColor }}>{t('account-state')}</Text>
            <View style={styles.accountStatus}>
              {userData?.premium && (
                <FontAwesomeIcon icon={Icons.Crown} size={20} color="#FFC107" />
              )}
              <Text
                style={
                  userData?.premium ? styles.premiumText : styles.basicText
                }
              >
                {userData?.premium ? 'Premium' : 'Basic'}
              </Text>
            </View>
          </View>
        </>
      </TouchableWithoutFeedback>

      {/* User Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>{t('email')}</Text>
        <Text style={styles.value}>{auth.currentUser?.email}</Text>
        <Text style={styles.label}>{t('date-of-birth')}</Text>
        <Text style={styles.value}>
          {userData?.dateOfBirth
            ? new Date(userData?.dateOfBirth!).toLocaleDateString()
            : t('date-of-birth-not-set')}
        </Text>

        {/* Change Password */}
        <TouchableOpacity
          style={{ padding: 15 }}
          onPress={() => navigation.navigate('PasswordChangeScreen')}
        >
          <Text style={styles.changePassword}>
            {t('change-password-title')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ padding: 15 }}
          onPress={() => setModalOpened(true)}
        >
          <Text style={styles.deleteAccount}>{t('delete-account')}</Text>
        </TouchableOpacity>
      </View>

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
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#0E0F1F',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  titlePrimary: {
    color: 'white',
  },
  titleSecondary: {
    color: '#00E1C9',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  username: {
    color: '#00E1C9',
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 8,
    marginBottom: 10,
  },
  accountStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumText: {
    color: '#FFC107',
    marginLeft: 4,
    fontSize: 16,
  },
  basicText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 16,
  },

  deleteAccount: {
    color: '#981a1a',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoSection: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
  },
  value: {
    color: '#00E1C9',
    fontSize: 16,
    marginBottom: 8,
  },
  changePassword: {
    color: 'white',
    textAlign: 'center',
    marginTop: 24,
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bottomAvatar: {
    borderWidth: 2,
    borderColor: '#FFC107',
  },
});

export default Account;
