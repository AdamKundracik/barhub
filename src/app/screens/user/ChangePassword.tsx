import React, { useState } from 'react';
import { getAuth, updatePassword } from 'firebase/auth';

import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import Layout from '../../components/user/Shared/Layout';
import { InputWrapper } from '../../components/shared/InputWrapper';
import { formStyles } from '../../utils/styles/styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { primaryColor, primaryTextColor } from '../../utils/styles/colors';
import { auth } from '../../../../firebaseConfig';

const PasswordChangeScreen = () => {
  const { t } = useTranslation(); // Initialize useTranslation

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Check if passwords match
  const passwordsMatch = password === confirmPassword && password !== '';

  async function handleUpdatePassword() {
    if (passwordsMatch && auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, password);
        Alert.alert('password changed successfully.');
      } catch (error) {
        console.error(error);
      }
    }
  }

  return (
    <Layout pageTitle={t('change-password-title')} isBackButtonShown>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.header}>{t('change-password-title')}</Text>

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
            onPress={async () => await handleUpdatePassword()}
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
