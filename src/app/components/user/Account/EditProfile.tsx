import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Layout from '../Shared/Layout';
import DatePicker from '../../shared/DatePicker';
import { User } from '../../../../../shared';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import FastImage from 'react-native-fast-image';
import { auth } from '../../../../../firebaseConfig';
import { primaryColor, primaryTextColor } from '../../../utils/styles/colors';
import { formStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import SlidingView from '../../shared/SlidingView';
import * as ImagePicker from 'expo-image-picker';
import {
  deleteProfilePicture,
  uploadProfilePhotoAsync,
} from '../../../utils/helper-functions/helperFunctions';
import { setUser } from '../../../utils/services/functions';
import { updateProfile } from 'firebase/auth';
import { useUserContext } from '../../../providers/UserProvider';
import LoadingIndicator from '../NewsFeed/LoadingIndicator';

type EditProfileProps = {
  user: User | null;
  onEditCLose: () => void;
};

const ProfileEditScreen = (props: EditProfileProps) => {
  const { t } = useTranslation();
  const { userData, fetchUserData, fetchAllUsers } = useUserContext();

  const [openImageOptions, setOpenImageOptions] = useState(false);
  const [username, setUsername] = useState<string | null | undefined>(
    auth.currentUser?.displayName
  );
  const [email, setEmail] = useState<string | null | undefined>(
    auth.currentUser?.email
  );
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

      setOpenImageOptions(false); // Close the sliding view after the action
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

      setOpenImageOptions(false); // Close the sliding view after the action
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
    setOpenImageOptions(false); // Close the sliding view after the action
  };

  return (
    <Layout pageTitle={'Edit profile'} showBottomTabs={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={props.onEditCLose}>
              <FontAwesomeIcon icon={Icons.Left} size={24} color={'white'} />
            </TouchableOpacity>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={() => setOpenImageOptions(true)}>
              <FastImage
                source={
                  auth.currentUser?.photoURL
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
              {/* Edit badge (pencil icon) */}
              <View style={styles.editIconContainer}>
                <FontAwesomeIcon
                  icon={Icons.Pencil}
                  size={20}
                  color={'white'}
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
              style={formStyles.inputPrimary}
            />
          </View>

          {/* Email input (non-editable) */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              value={email ?? ''}
              editable={false}
              style={[formStyles.inputPrimary, styles.nonEditable]}
            />
          </View>

          {/* Birthdate picker */}
          <View style={styles.birthDateContainer}>
            <Text style={styles.label}>Birthdate</Text>
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

      {/* Sliding view for image options */}
      <SlidingView
        visible={openImageOptions}
        onClose={() => setOpenImageOptions(false)}
        openGallery={openGallery}
        openCamera={openCamera}
        removePicture={removePicture}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: primaryColor,
    borderRadius: 20,
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: 'white',
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  birthDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nonEditable: {
    backgroundColor: '#333',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileEditScreen;
