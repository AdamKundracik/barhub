import React, { useState } from 'react';
import {
  Alert,
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
  warningColor,
} from '../../../utils/styles/colors';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { uploadService } from '../../../services/uploadService';
import SlidingView from '@/src/app/components/shared/Modals/SlidingView';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { useLocales } from 'expo-localization';
import { ClientDTO } from '@/src/app/types/dto';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useUserData } from '@/src/app/hooks/useUserQuery';
import { useQueryClient } from 'react-query';
import {
  addCacheBuster,
  createImageKey,
} from '@/src/app/utils/cache/imageCacheUtils';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';
import {
  getUnicodeValidationMessage,
  isValidUnicodeUsername,
} from '@/src/app/utils/validation/unicodeValidation';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { AlertCircleIcon } from '@/components/ui/icon';
import { buttonStyles } from '../../../utils/styles/buttonStyles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type EditProfileProps = {
  user: ClientDTO | null;
  onEditCLose: () => void;
};

const ProfileEditScreen = ({ user, onEditCLose }: EditProfileProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    updateProfileAsync,
    isUpdatingProfile,
    deletePhotoAsync,
    updatePhotoAsync,
    isUpdatingPhoto,
    isDeletingPhoto,
    displayName,
    email,
    photoUrl,
    isPremium,
    userId,
    refetch,
  } = useUserData();

  const locales = useLocales();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const [openImageOptions, setOpenImageOptions] = useState(false);
  const [username, setUsername] = useState<string | null | undefined>(
    displayName
  );
  const [userEmail] = useState<string | null | undefined>(email);
  const [birthDate, setBirthDate] = useState<Date>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : new Date()
  );
  const [datePickerOpened, setDatePickerOpened] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [isOpeningGallery, setIsOpeningGallery] = useState<boolean>(false);
  const [isOpeningCamera, setIsOpeningCamera] = useState<boolean>(false);
  const [photoCacheBuster, setPhotoCacheBuster] = useState<number>(Date.now());

  // Track original values to detect changes
  const originalUsername = displayName;
  const originalBirthDate = user?.dateOfBirth
    ? new Date(user.dateOfBirth)
    : new Date();

  function validateInputs(): boolean {
    return (
      !username ||
      username.trim().length === 0 ||
      !!dateError ||
      !!usernameError
    );
  }

  const isUsernameInvalid = (): boolean => {
    return !username || username.trim().length === 0 || !!usernameError;
  };

  const validateUsername = (value: string): void => {
    if (!value || value.trim().length === 0) {
      setUsernameError('');
      return;
    }

    if (!isValidUnicodeUsername(value)) {
      const errorMsg = getUnicodeValidationMessage(value);
      setUsernameError(
        errorMsg.includes('emoji')
          ? t('username-invalid-characters')
          : t('username-standard-chars-only')
      );
    } else {
      setUsernameError('');
    }
  };

  // Check if any data has changed
  const hasChanges = (): boolean => {
    const usernameChanged = username?.trim() !== originalUsername?.trim();
    const dateChanged =
      birthDate.toISOString().split('T')[0] !==
      originalBirthDate.toISOString().split('T')[0];
    return usernameChanged || dateChanged;
  };

  const validateAge = (date: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();

    // Calculate exact age
    const exactAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    return exactAge >= 13;
  };

  const handleImageUpload = async (uri: string) => {
    try {
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Upload image to storage
      const uploadedUri = await uploadService.uploadProfilePhoto(
        uri,
        parseInt(userId)
      );

      // Update photoUrl in database
      await updatePhotoAsync(uploadedUri);

      // Update cache buster to force image reload on physical devices
      setPhotoCacheBuster(Date.now());

      // Invalidate cache and refetch to ensure UI updates
      await queryClient.invalidateQueries(['user', 'data']);
      await queryClient.invalidateQueries(['posts']);
      await refetch();

      showSuccessToast(t('toastPhotoUpdatedTitle'), t('toastPhotoUpdatedDesc'));

      // Close edit profile after successful upload
      onEditCLose();
    } catch (error) {
      console.error('Error uploading image:', error);
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    } finally {
      setOpenImageOptions(false);
    }
  };

  const openGallery = async () => {
    let result: any = null;
    try {
      setIsOpeningGallery(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Permission denied');

      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        await handleImageUpload(result.assets[0].uri);
      }
      // Modal sa zatvorí až po úspešnom uploade v handleImageUpload
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
      setOpenImageOptions(false);
    } finally {
      setIsOpeningGallery(false);
      // Zatvor modal ak používateľ zrušil výber
      if (result?.canceled) {
        setOpenImageOptions(false);
      }
    }
  };

  const openCamera = async () => {
    let result: any = null;
    try {
      setIsOpeningCamera(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Permission denied');

      result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        // Backend will handle old image deletion automatically
        await handleImageUpload(result.assets[0].uri);
      }
      // Modal sa zatvorí až po úspešnom uploade v handleImageUpload
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
      setOpenImageOptions(false);
    } finally {
      setIsOpeningCamera(false);
      // Zatvor modal ak používateľ zrušil výber
      if (result?.canceled) {
        setOpenImageOptions(false);
      }
    }
  };

  const removePicture = async () => {
    try {
      // Use the new delete photo mutation with optimistic updates
      await deletePhotoAsync();

      // Update cache buster to force image reload on physical devices
      setPhotoCacheBuster(Date.now());

      // Invalidate cache to ensure UI updates
      await queryClient.invalidateQueries(['user', 'data']);
      await queryClient.invalidateQueries(['posts']);
      await refetch();

      showSuccessToast(t('toastPhotoDeletedTitle'), t('toastPhotoDeletedDesc'));
    } catch (error) {
      console.error('Error deleting photo:', error);
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    } finally {
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
    if (validateInputs()) return;

    try {
      // Use the new profile update mutation with optimistic updates
      await updateProfileAsync({
        name: username?.trim(),
        dateOfBirth: birthDate.toISOString(),
      });

      showSuccessToast(t('toastDataUpdatedTitle'), t('toastDataUpdatedDesc'));
      onEditCLose();
    } catch (error) {
      console.error('Error updating user:', error);
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      bottomOffset={100}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
        {/* Profile Picture Section */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            onPress={() =>
              !(isUpdatingPhoto || isDeletingPhoto) && setOpenImageOptions(true)
            }
            style={styles.profileImageContainer}
            disabled={isUpdatingPhoto || isDeletingPhoto}
          >
            <Avatar
              size="xl"
              style={[
                styles.avatarContainer,
                // Show premium border only if premium UI is enabled and user is premium
                PremiumHelpers.shouldShowPremiumBorders() &&
                  isPremium &&
                  styles.premiumBorder,
                (isUpdatingPhoto || isDeletingPhoto) &&
                  styles.profilePictureLoading,
              ]}
            >
              {photoUrl ? (
                <AvatarImage
                  key={createImageKey('edit-profile', userId, photoUrl)}
                  source={{
                    uri: addCacheBuster(photoUrl, userId),
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <AvatarFallbackText className={'text-white'}>
                  {username || 'User'}
                </AvatarFallbackText>
              )}
            </Avatar>

            <View style={styles.editIconContainer}>
              {isUpdatingPhoto || isDeletingPhoto ? (
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
          </TouchableOpacity>

          <Text style={styles.profileImageHint}>
            {t('tap-to-change-photo')}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          {/* Email Field */}
          <FormControl size="md" isDisabled={true} style={styles.formControl}>
            <FormControlLabel>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <FontAwesomeIcon
                  icon={Icons.Envelope}
                  size={14}
                  color={primaryColor}
                  style={{ marginBottom: 4 }}
                />
                <FormControlLabelText style={styles.labelText}>
                  {t('email')}
                </FormControlLabelText>
              </View>
            </FormControlLabel>
            <Input
              variant="rounded"
              size="xl"
              style={[styles.input, styles.disabledInput]}
            >
              <InputField
                type="text"
                value={userEmail!}
                editable={false}
                style={[styles.inputField, styles.disabledText]}
              />
            </Input>
          </FormControl>

          {/* Username Field */}
          <FormControl
            size="md"
            isInvalid={isUsernameInvalid()}
            style={styles.formControl}
          >
            <FormControlLabel>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <FontAwesomeIcon
                  icon={Icons.User}
                  size={14}
                  color={primaryColor}
                  style={{ marginBottom: 4 }}
                />
                <FormControlLabelText style={styles.labelText}>
                  {t('user-name')} <Text style={styles.requiredStar}>*</Text>
                </FormControlLabelText>
              </View>
            </FormControlLabel>
            <Input
              variant="rounded"
              size="xl"
              style={[
                styles.input,
                focusedInput === 'username' && styles.inputFocused,
                isUsernameInvalid() && styles.inputError,
              ]}
            >
              <InputField
                type="text"
                placeholder={t('enter-username')}
                value={username || ''}
                onChangeText={value => {
                  setUsername(value);
                  validateUsername(value);
                }}
                style={styles.inputField}
                maxLength={30}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
              />
            </Input>
            <Text style={styles.charCount}>{username?.length || 0}/30</Text>
            {isUsernameInvalid() && (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText style={styles.errorText}>
                  {usernameError || t('username-required')}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Date of Birth Field */}
          <FormControl size="md" style={styles.formControl}>
            <FormControlLabel>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <FontAwesomeIcon
                  icon={Icons.Calendar}
                  size={14}
                  color={primaryColor}
                  style={{ marginBottom: 4 }}
                />
                <FormControlLabelText style={styles.labelText}>
                  {t('date-of-birth')}
                </FormControlLabelText>
              </View>
            </FormControlLabel>
            <TouchableOpacity
              onPress={() => setDatePickerOpened(true)}
              style={[
                styles.input,
                styles.dateInput,
                focusedInput === 'dateOfBirth' && styles.inputFocused,
                dateError && styles.inputError,
              ]}
            >
              <Text style={styles.inputField}>
                {birthDate.toLocaleDateString(locales[0].languageCode!, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <FontAwesomeIcon
                icon={Icons.ChevronRight}
                size={16}
                color={separatorColor}
              />
            </TouchableOpacity>
            {dateError && (
              <Text style={[styles.errorText, { marginTop: 8 }]}>
                {dateError}
              </Text>
            )}
          </FormControl>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="solid"
            size="lg"
            style={[
              buttonStyles.primary,
              (isUpdatingProfile || validateInputs() || !hasChanges()) &&
                buttonStyles.primaryDisabled,
            ]}
            onPress={handleUpdateUser}
            isDisabled={isUpdatingProfile || validateInputs() || !hasChanges()}
          >
            {isUpdatingProfile ? (
              <ButtonSpinner color="#000" />
            ) : (
              <ButtonText style={buttonStyles.primaryText}>
                {t('save-changes')}
              </ButtonText>
            )}
          </Button>
        </View>
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

          // Validate age immediately after selection
          if (!validateAge(date)) {
            setDateError(t('minimum-age-required'));
          } else {
            setDateError('');
          }
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
        isOpeningGallery={isOpeningGallery}
        isOpeningCamera={isOpeningCamera}
        isDeletingPhoto={isDeletingPhoto}
      />
    </KeyboardAwareScrollView>
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
  avatarContainer: {
    width: 120,
    height: 120,
    borderWidth: 3,
    borderColor: separatorColor,
  },
  avatarImage: {
    borderWidth: 3,
    borderColor: separatorColor,
  },
  avatarFallback: {
    backgroundColor: 'transparent',
    color: 'white',
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
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formControl: {
    marginBottom: 16,
  },
  labelText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredStar: {
    color: warningColor,
    fontSize: 16,
  },
  input: {
    backgroundColor: primaryBgColor,
    borderColor: '#333',
    borderWidth: 1,
  },
  inputFocused: {
    borderColor: primaryColor,
    borderWidth: 2,
  },
  inputError: {
    borderColor: warningColor,
    borderWidth: 2,
  },
  inputField: {
    color: primaryTextColor,
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.8,
  },
  disabledText: {
    color: secondaryTextColor,
    opacity: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: primaryBgColor,
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 52,
  },
  errorText: {
    color: warningColor,
    fontSize: 14,
  },
  charCount: {
    fontSize: 12,
    color: secondaryTextColor,
    textAlign: 'right',
    marginTop: 6,
  },

  // Buttons Section
  buttonContainer: {
    gap: 16,
  },
});

export default ProfileEditScreen;
