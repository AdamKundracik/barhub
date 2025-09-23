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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../../utils/styles/styles';
import {
  primaryBgColor,
  primaryColor,
  primaryTextColor,
} from '../../utils/styles/colors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { auth } from '@/firebaseConfig';

const PasswordChangeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<
    null | 'oldPassword' | 'password' | 'confirmPassword'
  >(null);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword && password !== '';

  const hasPasswordLogin = auth.currentUser?.providerData
    .map(data => data.providerId)
    .includes('password');

  const getUserLoginMethod = () => {
    const user = getAuth().currentUser;
    if (!user) return null;
    const providers = user.providerData.map(p => p.providerId);
    if (providers.includes('google.com')) return 'google';
    if (providers.includes('password')) return 'email';
    return 'other';
  };

  const reauthenticateAndChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    setLoading(true);
    const user = getAuth().currentUser;
    if (!user) return;

    const loginMethod = getUserLoginMethod();

    try {
      if (loginMethod === 'email' && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      } else if (loginMethod === 'google') {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const googleCredential = GoogleAuthProvider.credential(
          userInfo.idToken
        );
        await reauthenticateWithCredential(user, googleCredential);
      } else {
        console.error('Unsupported login method for re-authentication.');
        return;
      }

      await updatePassword(user, newPassword);
      Alert.alert('Success', t('password-changed-success'));
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', t('password-change-error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout clickFunction={() => navigation.goBack()}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Center>
            <Heading size="2xl" style={styles.header}>
              {t('change-password-title')}
            </Heading>
          </Center>

          <View style={styles.formWrapper}>
            {hasPasswordLogin && (
              <FormControl style={formStyles.formControl} size="lg">
                <FormControlLabel>
                  <FormControlLabelText style={{ color: primaryColor }}>
                    {t('old-password')}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="rounded"
                  size="xl"
                  style={
                    focusedInput === 'oldPassword'
                      ? formStyles.inputPrimaryFocused
                      : formStyles.inputPrimary
                  }
                >
                  <InputField
                    type={oldPasswordVisible ? 'text' : 'password'}
                    placeholder={t('old-password')}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    style={{ color: primaryTextColor }}
                    onFocus={() => setFocusedInput('oldPassword')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <InputSlot
                    onPress={() => setOldPasswordVisible(!oldPasswordVisible)}
                  >
                    <InputIcon as={oldPasswordVisible ? EyeIcon : EyeOffIcon} />
                  </InputSlot>
                </Input>
              </FormControl>
            )}

            <FormControl
              style={formStyles.formControl}
              size="lg"
              isInvalid={password.length > 0 && password.length < 6}
            >
              <FormControlLabel>
                <FormControlLabelText style={{ color: primaryColor }}>
                  {t('new-password')}
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="rounded"
                size="xl"
                style={
                  focusedInput === 'password'
                    ? formStyles.inputPrimaryFocused
                    : formStyles.inputPrimary
                }
              >
                <InputField
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder={t('new-password')}
                  value={password}
                  onChangeText={setPassword}
                  style={{ color: primaryTextColor }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
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

            <FormControl
              style={formStyles.formControl}
              size="lg"
              isInvalid={confirmPassword.length > 0 && !passwordsMatch}
            >
              <FormControlLabel>
                <FormControlLabelText style={{ color: primaryColor }}>
                  {t('confirm-password')}
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="rounded"
                size="xl"
                style={
                  focusedInput === 'confirmPassword'
                    ? formStyles.inputPrimaryFocused
                    : formStyles.inputPrimary
                }
              >
                <InputField
                  type={confirmPasswordVisible ? 'text' : 'password'}
                  placeholder={t('confirm-password')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={{ color: primaryTextColor }}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                />
                <InputSlot
                  onPress={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                >
                  <InputIcon
                    as={confirmPasswordVisible ? EyeIcon : EyeOffIcon}
                  />
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

            {/* Submit button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() =>
                reauthenticateAndChangePassword(oldPassword, password)
              }
              disabled={loading || password.length < 6 || !passwordsMatch}
            >
              <Text style={styles.submitButtonText}>
                {loading ? t('loading') : t('change-password')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: primaryBgColor,
  },
  header: {
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  formWrapper: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: primaryColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PasswordChangeScreen;
