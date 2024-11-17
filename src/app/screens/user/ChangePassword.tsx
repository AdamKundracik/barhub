import React, { useState } from 'react';
import {
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/user/Shared/Layout';
import { InputWrapper } from '../../components/shared/InputWrapper';
import { formStyles } from '../../utils/styles/styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { primaryColor, primaryTextColor } from '../../utils/styles/colors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import firebase from 'firebase/compat';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../../../../firebaseConfig';
import EmailAuthProvider = firebase.auth.EmailAuthProvider;

const PasswordChangeScreen = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);

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
        const userInfo = await GoogleSignin.signIn(); // Initiate the Google Sign-In flow
        const googleCredential = GoogleAuthProvider.credential(
          userInfo.idToken
        );

        await reauthenticateWithCredential(user, googleCredential);
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
    <Layout pageTitle={t('change-password-title')}>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={Icons.Left} size={16} color="white" />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.header}>{t('change-password-title')}</Text>

          {hasPasswordLogin && (
            <InputWrapper
              passwordInput={true}
              inputLabel={t('old-password')}
              togglePassword={oldPasswordVisible}
              setTogglePassword={setOldPasswordVisible}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder={t('old-password')}
                  secureTextEntry={!oldPasswordVisible}
                  style={[formStyles.inputPrimary, styles.textInput]}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholderTextColor={primaryTextColor}
                />
              </View>
            </InputWrapper>
          )}

          <InputWrapper
            passwordInput={true}
            inputLabel={t('new-password')}
            togglePassword={passwordVisible}
            setTogglePassword={setPasswordVisible}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder={t('new-password')}
                secureTextEntry={!passwordVisible}
                style={[formStyles.inputPrimary, styles.textInput]}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={primaryTextColor}
              />
              <FontAwesomeIcon
                icon={passwordsMatch ? Icons.Check : Icons.Remove}
                size={16}
                color={passwordsMatch ? 'green' : 'red'}
                style={styles.checkIcon}
              />
            </View>
          </InputWrapper>

          <InputWrapper
            passwordInput={true}
            inputLabel={t('confirm-password')}
            togglePassword={confirmPasswordVisible}
            setTogglePassword={setConfirmPasswordVisible}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder={t('password-placeholder')}
                secureTextEntry={!confirmPasswordVisible}
                style={[formStyles.inputPrimary, styles.textInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor={primaryTextColor}
              />
              <FontAwesomeIcon
                icon={passwordsMatch ? Icons.Check : Icons.Remove}
                size={16}
                color={passwordsMatch ? 'green' : 'red'}
                style={styles.checkIcon}
              />
            </View>
          </InputWrapper>

          <TouchableOpacity
            style={formStyles.buttonSecondary}
            onPress={async () =>
              await reauthenticateAndChangePassword(oldPassword, password)
            }
            disabled={!passwordsMatch}
          >
            <Text style={[formStyles.buttonText, { color: primaryColor }]}>
              {t('save-changes')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
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
    paddingRight: 40, // To prevent text from going under the check icon
  },
  checkIcon: {
    marginLeft: 10,
  },
});

export default PasswordChangeScreen;
