import React, { useState } from 'react';
import {
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../../utils/styles/styles';
import { primaryColor, primaryTextColor } from '../../utils/styles/colors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../../../../firebaseConfig';
import { ScreenLayout } from '@/src/app/components/user/Shared/ScreenLayout';
import { Center } from '@/components/ui/center';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';

const PasswordChangeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword && password !== '';

  const hasPasswordLogin = auth.currentUser?.providerData
    .map(data => data.providerId)
    .includes('password');

  const getUserLoginMethod = () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('No user is currently logged in.');
      return null;
    }

    const providers = user.providerData.map(provider => provider.providerId);

    if (providers.includes('google.com')) {
      return 'google';
    }

    if (providers.includes('password')) {
      return 'email';
    }

    return 'other';
  };

  const reauthenticateAndChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    setLoading(true);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('No authenticated user found.');
      return;
    }

    const loginMethod = getUserLoginMethod();

    try {
      if (loginMethod === 'email' && user.email) {
        // Re-authenticate with Email/Password
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      } else if (loginMethod === 'google') {
        // Re-authenticate with Google
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const googleCredential = GoogleAuthProvider.credential(
          userInfo.idToken
        );

        await reauthenticateWithCredential(user, googleCredential);
        setLoading(false);
      } else {
        console.error('Unsupported login method for re-authentication.');
        return;
      }

      // After re-authentication, update the password
      await updatePassword(user, newPassword);
      Alert.alert('Password changed successfully.');
    } catch (error) {
      console.error(
        'Error during re-authentication or updating password:',
        error
      );
    }
  };

  return (
    <ScreenLayout clickFunction={() => navigation.goBack()}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.header}>{t('change-password-title')}</Text>
          {hasPasswordLogin && (
            <FormControl style={formStyles.formControl}>
              <FormControlLabel>
                <FormControlLabelText style={{ color: primaryColor }}>
                  {t('old-password')}
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="rounded"
                size="xl"
                style={formStyles.inputPrimary}
              >
                <InputField
                  type={oldPasswordVisible ? 'text' : 'password'}
                  placeholder={t('old-password')}
                  style={{ color: primaryTextColor }}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <InputSlot
                  onPress={() => setOldPasswordVisible(!oldPasswordVisible)}
                >
                  <InputIcon as={oldPasswordVisible ? EyeIcon : EyeOffIcon} />
                </InputSlot>
              </Input>
            </FormControl>
          )}

          {/* New password */}
          <FormControl
            style={formStyles.formControl}
            isInvalid={password.length < 6}
          >
            <FormControlLabel>
              <FormControlLabelText style={{ color: primaryColor }}>
                {t('new-password')}
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="rounded" size="xl" style={formStyles.inputPrimary}>
              <InputField
                type={passwordVisible ? 'text' : 'password'}
                placeholder={t('new-password')}
                style={{ color: primaryTextColor }}
                value={password}
                onChangeText={setPassword}
              />
              <InputSlot onPress={() => setPasswordVisible(!passwordVisible)}>
                <InputIcon as={passwordVisible ? EyeIcon : EyeOffIcon} />
              </InputSlot>
            </Input>
            <FormControlError>
              <FormControlErrorIcon
                as={AlertCircleIcon}
                className="text-red-500"
              />
              <FormControlErrorText className="text-red-500">
                {t('password-too-short')}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>

          {/* Confirm password */}
          <FormControl
            style={formStyles.formControl}
            isInvalid={!passwordsMatch}
          >
            <FormControlLabel>
              <FormControlLabelText style={{ color: primaryColor }}>
                {t('confirm-password')}
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="rounded" size="xl" style={formStyles.inputPrimary}>
              <InputField
                type={confirmPasswordVisible ? 'text' : 'password'}
                placeholder={t('confirm-password')}
                style={{ color: primaryTextColor }}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <InputSlot
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              >
                <InputIcon as={confirmPasswordVisible ? EyeIcon : EyeOffIcon} />
              </InputSlot>
            </Input>
            <FormControlError>
              <FormControlErrorIcon
                as={AlertCircleIcon}
                className="text-red-500"
              />
              <FormControlErrorText className="text-red-500">
                {t('noMatchingPasswords')}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>

          <Center>
            <Button
              variant="solid"
              size="md"
              action="primary"
              style={formStyles.buttonPrimary}
              onPress={() => {
                setLoading(true);
                reauthenticateAndChangePassword(oldPassword, password);
              }}
              isDisabled={!passwordsMatch}
            >
              {!loading && (
                <ButtonText style={formStyles.buttonText}>
                  {t('save-changes')}
                </ButtonText>
              )}
              {loading && <ButtonSpinner />}
            </Button>
          </Center>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  textInput: {
    flex: 1,
    paddingRight: 40,
  },
  checkIcon: {
    marginLeft: 10,
  },
});

export default PasswordChangeScreen;
