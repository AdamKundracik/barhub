import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  separatorColor,
} from '../../../utils/styles/colors';
import { formStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  deleteProfilePicture,
  uploadProfilePhotoAsync,
} from '../../../utils/helper-functions/imageUploadFunctions';
import { setUser } from '../../../utils/services/functions';
import { updateProfile } from 'firebase/auth';
import SlidingView from '@/src/app/components/shared/Modals/SlidingView';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { useLocales } from 'expo-localization';
import { auth } from '@/firebaseConfig';
import { User } from '@/shared';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useQueryClient } from 'react-query';
import { useUserData } from '@/src/app/utils/hooks/useUserData';
import FastImage from 'react-native-fast-image';

type EditProfileProps = {
  user: User | null;
  onEditCLose: () => void;
};

const ProfileEditScreen = ({ user, onEditCLose }: EditProfileProps) => {
  const { t } = useTranslation();
  const { refetch: fetchUserData } = useUserData();
  const locales = useLocales();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const queryClient = useQueryClient();

  const [openImageOptions, setOpenImageOptions] = useState(false);
  const [username, setUsername] = useState<string | null | undefined>(
    auth.currentUser?.displayName
  );
  const [email] = useState<string | null | undefined>(auth.currentUser?.email);
  const [birthDate, setBirthDate] = useState<Date>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : new Date()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [datePickerOpened, setDatePickerOpened] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  function validateInputs(): boolean {
    return !username || username.trim().length === 0;
  }

  const handleImageUpload = async (uri: string) => {
    setImageUploading(true);
    try {
      const uploadedUri = await uploadProfilePhotoAsync(uri);
      const response = await setUser({ photoURL: uploadedUri });

      if (response.success) {
        await updateProfile(auth.currentUser!, { photoURL: uploadedUri });
        await queryClient.invalidateQueries({
          queryKey: ['userData', auth.currentUser?.uid],
        });
        showSuccessToast(
          t('toastPhotoUpdatedTitle'),
          t('toastPhotoUpdatedDesc')
        );
      } else {
        showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
      }
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    } finally {
      setImageUploading(false);
      setOpenImageOptions(false);
    }
  };

  const openGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Permission denied');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        await handleImageUpload(result.assets[0].uri);
      } else {
        setOpenImageOptions(false);
      }
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
      setOpenImageOptions(false);
    }
  };

  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Permission denied');

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        if (auth.currentUser?.providerId !== 'google.com') {
          await deleteProfilePicture(auth.currentUser?.uid!);
        }
        await handleImageUpload(result.assets[0].uri);
      } else {
        setOpenImageOptions(false);
      }
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
      setOpenImageOptions(false);
    }
  };

  const removePicture = async () => {
    setImageUploading(true);
    try {
      if (auth.currentUser?.providerId !== 'google.com') {
        await deleteProfilePicture(auth.currentUser?.uid!);
      }
      const response = await setUser({ photoURL: '' });
      if (response.success) {
        await updateProfile(auth.currentUser!, { photoURL: '' });
        await queryClient.invalidateQueries({
          queryKey: ['userData', auth.currentUser?.uid],
        });
        showSuccessToast(
          t('toastPhotoDeletedTitle'),
          t('toastPhotoDeletedDesc')
        );
      } else {
        showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
      }
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    } finally {
      setImageUploading(false);
      setOpenImageOptions(false);
    }
  };

  const confirmRemovePicture = () => {
    Alert.alert(
      t('delete-photo-title'),
      t('delete-photo-info'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('submit'), style: 'destructive', onPress: removePicture },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateUser = async () => {
    if (!auth.currentUser || validateInputs()) return;

    setIsSaving(true);
    try {
      const response = await setUser({
        displayName: username?.trim(),
        dateOfBirth: birthDate.toISOString(),
      });

      if (response.success) {
        await updateProfile(auth.currentUser, {
          displayName: username?.trim(),
        });
        if (fetchUserData) await fetchUserData();
        showSuccessToast(t('toastDataUpdatedTitle'), t('toastDataUpdatedDesc'));
        onEditCLose();
      } else {
        showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
      }
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            onPress={() => !imageUploading && setOpenImageOptions(true)}
            style={styles.profileImageContainer}
            disabled={imageUploading}
          >
            <FastImage
              source={
                auth.currentUser?.photoURL
                  ? {
                      uri: auth.currentUser.photoURL,
                      priority: FastImage.priority.normal,
                    }
                  : require('../../../../../assets/userIcon.png')
              }
              style={[
                styles.profilePicture,
                user?.premium && styles.premiumBorder,
                imageUploading && styles.profilePictureLoading,
              ]}
              resizeMode={FastImage.resizeMode.cover}
            />

            <View style={styles.editIconContainer}>
              {imageUploading ? (
                <View style={styles.loadingContainer}>
                  <ButtonSpinner color={primaryBgColor} size="small" />
                </View>
              ) : (
                <FontAwesomeIcon
                  icon={Icons.Pencil}
                  size={16}
                  color={primaryBgColor}
                />
              )}
            </View>

            {user?.premium && (
              <View style={styles.premiumBadge}>
                <FontAwesomeIcon icon={Icons.Crown} size={12} color="#FFC107" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.profileImageHint}>
            {t('tap-to-change-photo')}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          {/* Email Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <FontAwesomeIcon
                icon={Icons.Envelope}
                size={16}
                color={primaryColor}
              />
              <Text style={styles.inputLabel}>{t('email')}</Text>
            </View>
            <Input
              variant="rounded"
              size="xl"
              style={[formStyles.inputPrimary, styles.input]}
            >
              <InputField
                type="text"
                value={email!}
                editable={false}
                style={[styles.inputText, styles.disabledText]}
              />
            </Input>
          </View>

          {/* Username Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <FontAwesomeIcon
                icon={Icons.User}
                size={16}
                color={primaryColor}
              />
              <Text style={styles.inputLabel}>{t('user-name')}</Text>
            </View>
            <Input
              variant="rounded"
              size="xl"
              style={[
                formStyles.inputPrimary,
                styles.input,
                validateInputs() && styles.inputError,
              ]}
            >
              <InputField
                type="text"
                placeholder={t('enter-username')}
                value={username || ''}
                onChangeText={setUsername}
                style={styles.inputText}
                maxLength={30}
              />
            </Input>
            {validateInputs() && (
              <Text style={styles.errorText}>{t('username-required')}</Text>
            )}
            <Text style={styles.charCount}>{username?.length || 0}/30</Text>
          </View>

          {/* Date of Birth Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <FontAwesomeIcon
                icon={Icons.Calendar}
                size={16}
                color={primaryColor}
              />
              <Text style={styles.inputLabel}>{t('date-of-birth')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setDatePickerOpened(true)}
              style={[formStyles.inputPrimary, styles.input, styles.dateInput]}
            >
              <Text style={styles.inputText}>
                {birthDate.toLocaleDateString(locales[0].languageCode!, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <FontAwesomeIcon
                icon={Icons.ChevronRight}
                size={14}
                color={separatorColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="solid"
            size="lg"
            action="primary"
            style={[
              styles.saveButton,
              (isSaving || validateInputs()) && styles.saveButtonDisabled,
            ]}
            onPress={handleUpdateUser}
            isDisabled={isSaving || validateInputs()}
          >
            {isSaving ? (
              <ButtonSpinner color="white" />
            ) : (
              <ButtonText style={styles.saveButtonText}>
                {t('save-changes')}
              </ButtonText>
            )}
          </Button>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={datePickerOpened}
        date={birthDate}
        locale={locales[0].languageCode!}
        mode="date"
        maximumDate={new Date()}
        minimumDate={new Date(1900, 0, 1)}
        onConfirm={date => {
          setDatePickerOpened(false);
          setBirthDate(date);
        }}
        onCancel={() => setDatePickerOpened(false)}
        title={t('select-birth-date')}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
      />

      {/* Image Options Modal */}
      <SlidingView
        visible={openImageOptions}
        onClose={() => setOpenImageOptions(false)}
        openGallery={openGallery}
        openCamera={openCamera}
        removePicture={confirmRemovePicture}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 150,
  },

  // Header Section
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
  },

  // Profile Picture Section
  profileCard: {
    backgroundColor: postBgColor,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: separatorColor,
  },
  profilePictureLoading: {
    opacity: 0.6,
  },
  premiumBorder: {
    borderColor: '#FFC107',
    borderWidth: 3,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: primaryColor,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: postBgColor,
  },
  loadingContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  profileImageHint: {
    fontSize: 14,
    color: secondaryTextColor,
    textAlign: 'center',
  },

  // Form Section
  formCard: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    gap: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryColor,
    marginLeft: 8,
    flex: 1,
  },
  requiredIndicator: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(68, 170, 68, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: '#44AA44',
    marginLeft: 4,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    backgroundColor: primaryBgColor,
    borderWidth: 2,
    borderColor: separatorColor,
    minHeight: 52,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  inputText: {
    color: primaryTextColor,
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: secondaryTextColor,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    marginLeft: 4,
  },
  charCount: {
    fontSize: 12,
    color: secondaryTextColor,
    textAlign: 'right',
    marginTop: 4,
  },

  // Buttons Section
  buttonContainer: {
    gap: 16,
  },
  saveButton: {
    backgroundColor: primaryColor,
    borderRadius: 16,
    height: 56,
    elevation: 4,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: primaryBgColor,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: separatorColor,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: separatorColor,
  },
});

export default ProfileEditScreen;
