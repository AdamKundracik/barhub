import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import {
  primaryBgColor,
  primaryColor,
  primaryTextColor,
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
import SlidingView from '../../shared/SlidingView';
import { Image } from 'expo-image';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { useLocales } from 'expo-localization';
import { auth } from '@/firebaseConfig';
import { User } from '@/shared';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useQueryClient } from 'react-query';
import { useUserData } from '@/src/app/utils/hooks/useUserData';

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

  const openGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Permission denied');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 4],
      });

      if (!result.canceled) {
        const uri = await uploadProfilePhotoAsync(result.assets[0].uri);

        const response = await setUser({ photoURL: uri });
        if (response.success) {
          await updateProfile(auth.currentUser!, { photoURL: uri });
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
      }
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    } finally {
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
        aspect: [4, 4],
      });

      if (!result.canceled) {
        if (auth.currentUser?.providerId !== 'google.com') {
          await deleteProfilePicture(auth.currentUser?.uid!);
        }

        const uri = await uploadProfilePhotoAsync(result.assets[0].uri);
        const response = await setUser({ photoURL: uri });

        if (response.success) {
          await updateProfile(auth.currentUser!, { photoURL: uri });
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
      }
    } catch {
      showErrorToast(t('toastErrorTitle'), t('toastErrorDesc'));
    } finally {
      setOpenImageOptions(false);
    }
  };

  const removePicture = async () => {
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
    if (!auth.currentUser) return;

    setIsSaving(true);
    try {
      const response = await setUser({
        displayName: username,
        dateOfBirth: birthDate.toISOString(),
      });

      if (response.success) {
        await updateProfile(auth.currentUser, { displayName: username });
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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => setOpenImageOptions(true)}>
            <Image
              source={
                auth.currentUser?.photoURL
                  ? { uri: auth.currentUser.photoURL }
                  : require('../../../../../assets/userIcon.png')
              }
              style={[
                styles.profilePicture,
                user?.premium && { borderWidth: 1, borderColor: '#FFC107' },
              ]}
              contentFit="cover"
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

        {/* Email input (read-only) */}
        <FormControl size="lg" isDisabled style={formStyles.formControl}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: primaryColor }}>
              {t('email')}
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="rounded" size="xl" style={formStyles.inputPrimary}>
            <InputField
              type="text"
              placeholder={t('email')}
              value={email!}
              style={{ color: primaryTextColor }}
            />
          </Input>
        </FormControl>

        {/* Username input */}
        <FormControl size="lg" style={formStyles.formControl}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: primaryColor }}>
              {t('user-name')}
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="rounded" size="xl" style={formStyles.inputPrimary}>
            <InputField
              type="text"
              placeholder={t('user-name')}
              value={username!}
              onChangeText={setUsername}
              style={{ color: primaryTextColor }}
            />
          </Input>
        </FormControl>

        {/* Date of birth */}
        <FormControl size="lg" style={formStyles.formControl}>
          <FormControlLabelText style={{ color: primaryColor }}>
            {t('date-of-birth')}
          </FormControlLabelText>
          <Input variant="rounded" size="xl" style={formStyles.inputPrimary}>
            <InputField
              value={birthDate.toLocaleDateString()}
              onPress={() => setDatePickerOpened(true)}
              style={{ color: primaryTextColor }}
            />
          </Input>
          <DatePicker
            modal
            open={datePickerOpened}
            date={birthDate}
            locale={locales[0].languageCode!}
            mode="date"
            onConfirm={date => {
              setDatePickerOpened(false);
              setBirthDate(date);
            }}
            onCancel={() => setDatePickerOpened(false)}
          />
        </FormControl>

        {/* Save button */}
        <Center>
          <Button
            variant="solid"
            size="md"
            action="primary"
            style={formStyles.buttonPrimary}
            onPress={handleUpdateUser}
            isDisabled={isSaving}
          >
            {!isSaving ? (
              <ButtonText style={formStyles.buttonText}>{t('save')}</ButtonText>
            ) : (
              <ButtonSpinner />
            )}
          </Button>
        </Center>
      </ScrollView>

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

export const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    marginBottom: 15,
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
    padding: 7,
  },
});

export default ProfileEditScreen;
