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
import { User } from '../../../../../shared';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { auth } from '../../../../../firebaseConfig';
import {
  primaryBgColor,
  primaryColor,
  primaryDeepColor,
  primaryLightGrey,
  primaryTextColor,
} from '../../../utils/styles/colors';
import { commonAppStyles, formStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  deleteProfilePicture,
  uploadProfilePhotoAsync,
} from '../../../utils/helper-functions/imageUploadFunctions';
import { setUser } from '../../../utils/services/functions';
import { updateProfile } from 'firebase/auth';
import { useUserContext } from '../../../providers/UserProvider';
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
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useLocales } from 'expo-localization';

type EditProfileProps = {
  user: User | null;
  onEditCLose: () => void;
};

const ProfileEditScreen = (props: EditProfileProps) => {
  const { t } = useTranslation();
  const { fetchUserData } = useUserContext();
  const locales = useLocales();

  const [openImageOptions, setOpenImageOptions] = useState(false);
  const [username, setUsername] = useState<string | null | undefined>(
    auth.currentUser?.displayName
  );
  const [email] = useState<string | null | undefined>(auth.currentUser?.email);
  const [birthDate, setBirthDate] = useState<Date>(
    props.user?.dateOfBirth ? new Date(props.user?.dateOfBirth) : new Date()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [datePickerOpened, setDatePickerOpened] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = React.useState(false);

  const handleClose = () => setShowAlertDialog(false);

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
    setShowAlertDialog(false);
    setOpenImageOptions(false);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 10 }}
        >
          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={() => setOpenImageOptions(true)}>
              <Image
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

          {/* Username input */}
          <FormControl
            size="lg"
            isDisabled={true}
            isReadOnly={false}
            isRequired={false}
            style={formStyles.formControl}
          >
            <FormControlLabel>
              <FormControlLabelText style={{ color: primaryColor }}>
                {t('email')}
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              className="my-1"
              variant={'rounded'}
              size="xl"
              style={formStyles.inputPrimary}
            >
              <InputField
                type="text"
                placeholder={t('email')}
                style={{ color: primaryTextColor }}
                value={email!}
              />
            </Input>
          </FormControl>

          <FormControl
            size="lg"
            isDisabled={false}
            isReadOnly={false}
            isRequired={false}
            style={formStyles.formControl}
          >
            <FormControlLabel>
              <FormControlLabelText style={{ color: primaryColor }}>
                {t('user-name')}
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              className="my-1"
              variant={'rounded'}
              size="xl"
              style={formStyles.inputPrimary}
            >
              <InputField
                type="text"
                placeholder={t('user-name')}
                style={{ color: primaryTextColor }}
                value={username!}
                onChangeText={setUsername}
              />
            </Input>
          </FormControl>

          <FormControl
            size="lg"
            isDisabled={false}
            isReadOnly={false}
            isRequired={false}
            style={formStyles.formControl}
          >
            <FormControlLabelText style={{ color: primaryColor }}>
              {t('date-of-birth')}
            </FormControlLabelText>
            <Input
              className="my-1"
              variant={'rounded'}
              size="xl"
              style={formStyles.inputPrimary}
            >
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
              mode={'date'}
              onConfirm={date => {
                setDatePickerOpened(false);
                setBirthDate(date);
              }}
              onCancel={() => {
                setDatePickerOpened(false);
              }}
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
              {!isSaving && (
                <ButtonText style={formStyles.buttonText}>
                  {t('save')}
                </ButtonText>
              )}
              {isSaving && <ButtonSpinner />}
            </Button>
          </Center>
        </ScrollView>
      </KeyboardAvoidingView>
      <SlidingView
        visible={openImageOptions}
        onClose={() => setOpenImageOptions(false)}
        openGallery={openGallery}
        openCamera={openCamera}
        removePicture={() => setShowAlertDialog(true)}
      />
      <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent
          style={{
            backgroundColor: primaryDeepColor,
            borderColor: primaryColor,
          }}
        >
          <AlertDialogHeader>
            <Heading
              className="text-typography-950 font-semibold"
              size="md"
              style={commonAppStyles.textSecondary}
            >
              {t('delete-photo-title')}
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-3 mb-4">
            <Text size="sm" style={{ color: primaryLightGrey }}>
              {t('delete-photo-info')}
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={handleClose}
              size="sm"
            >
              <ButtonText>{t('cancel')}</ButtonText>
            </Button>
            <Button size="sm" action={'negative'} onPress={removePicture}>
              <ButtonText>{t('submit')}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },

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

  birthDateContainer: {
    marginBottom: 16,
  },
  birthDateLabel: {
    color: typography.labelColor,
    fontSize: typography.baseSize,
    marginBottom: 10,
  },

  saveButtonText: {
    color: colors.white,
    fontSize: typography.baseSize,
    fontWeight: 'bold',
  },
});

export default ProfileEditScreen;
