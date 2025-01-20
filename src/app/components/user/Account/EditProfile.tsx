import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from '../../shared/DatePicker';
import { User } from '../../../../../shared';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import FastImage from 'react-native-fast-image';
import { auth } from '../../../../../firebaseConfig';
import { primaryBgColor, primaryColor } from '../../../utils/styles/colors';
import { formStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  deleteProfilePicture,
  uploadProfilePhotoAsync,
} from '../../../utils/helper-functions/imageUploadFunctions';
import { setUser } from '../../../utils/services/functions';
import { updateProfile } from 'firebase/auth';
import { useUserContext } from '../../../providers/UserProvider';
import LoadingIndicator from '../NewsFeed/LoadingIndicator';
import SlidingView from '../../shared/SlidingView';

type EditProfileProps = {
  user: User | null;
  onEditCLose: () => void;
};

const ProfileEditScreen = (props: EditProfileProps) => {
  const { t } = useTranslation();
  const { fetchUserData, fetchAllUsers } = useUserContext();

  const [openImageOptions, setOpenImageOptions] = useState(false);
  const [username, setUsername] = useState<string | null | undefined>(
    auth.currentUser?.displayName
  );
  const [email] = useState<string | null | undefined>(auth.currentUser?.email);
  const [birthDate, setBirthDate] = useState<Date>(
    props.user?.dateOfBirth ? new Date(props.user?.dateOfBirth) : new Date()
  );
  const [isSaving, setIsSaving] = useState(false);

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

      setOpenImageOptions(false);
    }
  };

  const handleUpdateUser = async () => {
    setIsSaving(true);
    if (auth.currentUser) {
      await setUser({
        displayName: username,
        dateOfBirth: birthDate.toISOString(),
      });
      await updateProfile(auth.currentUser, {
        displayName: username,
      });
      if (fetchUserData) await fetchUserData();

      props.onEditCLose();
      setIsSaving(false);
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

      setOpenImageOptions(false);
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
    setOpenImageOptions(false);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }} // Add this back
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Adjust this offset if needed
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 10 }}
        >
          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={() => setOpenImageOptions(true)}>
              <FastImage
                source={
                  auth.currentUser?.photoURL && auth.currentUser.photoURL !== ''
                    ? { uri: auth.currentUser.photoURL }
                    : require('../../../../../assets/userIcon.png')
                }
                style={[
                  styles.profilePicture,
                  props.user?.premium && {
                    borderWidth: 1,
                    borderColor: '#FFC107',
                  },
                ]}
                resizeMode="cover"
              />
              <View style={styles.editIconContainer}>
                <FontAwesomeIcon
                  icon={Icons.Pencil}
                  size={18}
                  color={primaryBgColor}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Username input */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('user-name')}</Text>
            <TextInput
              value={username ?? ''}
              onChangeText={setUsername}
              style={[styles.input, formStyles.inputPrimary]}
            />
          </View>

          {/* Email input (non-editable) */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              value={email ?? ''}
              editable={false}
              style={[
                styles.input,
                formStyles.inputPrimary,
                styles.nonEditable,
              ]}
            />
          </View>

          {/* Birthdate picker */}
          <View style={styles.birthDateContainer}>
            <Text style={styles.birthDateLabel}>{t('date-of-birth')}</Text>
            <DatePicker
              onDateChange={date => setBirthDate(new Date(date))}
              initialValue={
                new Date(props.user ? props.user.dateOfBirth : '') ?? null
              }
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={formStyles.buttonSecondary}
            onPress={handleUpdateUser}
          >
            {isSaving ? (
              <LoadingIndicator />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <SlidingView
        visible={openImageOptions}
        onClose={() => setOpenImageOptions(false)}
        openGallery={openGallery}
        openCamera={openCamera}
        removePicture={removePicture}
      />
    </>
  );
};

const colors = {
  white: 'white',
  darkBackground: '#333',
  premiumBorder: '#FFC107',
};

const typography = {
  baseSize: 16,
  labelColor: colors.white,
};

const dimensions = {
  profilePictureSize: 150,
  profilePictureBorderRadius: 75,
  editIconSize: 20,
  editIconPadding: 7,
};

export const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },

  // Profile Picture Section
  profileSection: {
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  profilePicture: {
    width: dimensions.profilePictureSize,
    height: dimensions.profilePictureSize,
    borderRadius: dimensions.profilePictureBorderRadius,
    marginBottom: 20,
  },
  premiumBorder: {
    borderWidth: 1,
    borderColor: colors.premiumBorder,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: primaryColor,
    borderRadius: 20,
    padding: dimensions.editIconPadding,
  },

  // Input Styles
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: typography.labelColor,
    width: 100,
    fontSize: typography.baseSize,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: typography.baseSize,
    padding: 10,
  },
  nonEditable: {
    backgroundColor: colors.darkBackground,
  },

  // Birth Date Styles
  birthDateContainer: {
    marginBottom: 16,
  },
  birthDateLabel: {
    color: typography.labelColor,
    fontSize: typography.baseSize,
    marginBottom: 10,
  },

  // Button Styles
  saveButtonText: {
    color: colors.white,
    fontSize: typography.baseSize,
    fontWeight: 'bold',
  },
});

export default ProfileEditScreen;
