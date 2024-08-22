import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as React from 'react';
import { useState } from 'react';

import AuthLayout from '../../components/auth/AuthLayout';
import { InputWrapper } from '../../components/shared/InputWrapper';
import { commonAppStyles, formStyles } from '../../utils/styles/styles';
import { auth } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';

export const LogIn = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [togglePassword, setTogglePassword] = useState(true);
  const [loading, setLoading] = useState(false);

  GoogleSignin.configure({
    webClientId:
      '995791421821-tedjmv2vuu6coprv5ij6h5dje9io5rls.apps.googleusercontent.com',
    iosClientId:
      '995791421821-fjmj5qmj8j48e4s13nktbiqkt6gq83jb.apps.googleusercontent.com',
  });

  async function onGoogleButtonPress() {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Get the users ID token
    const { idToken } = await GoogleSignin.signIn();

    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    await signInWithCredential(auth, googleCredential);
  }

  async function onSignIn() {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password).catch(error => {
      if (error.code === 'auth/email-already-in-use') {
        console.log('That email address is already in use!');
      }

      if (error.code === 'auth/invalid-email') {
        console.log('That email address is invalid!');
      }
    });
  }

  return (
    <AuthLayout pageTitle={t('register')}>
      <InputWrapper inputLabel={t('email')}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={formStyles.inputPrimary}
          placeholder={t('email')}
          keyboardType={'email-address'}
        />
      </InputWrapper>
      <InputWrapper
        inputLabel={t('password')}
        setTogglePassword={setTogglePassword}
        togglePassword={togglePassword}
        passwordInput
      >
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={togglePassword}
          style={formStyles.inputPrimary}
          placeholder={t('password')}
        />
      </InputWrapper>
      <TouchableOpacity
        onPress={onSignIn}
        style={[formStyles.buttonPrimary]}
        disabled={loading}
      >
        {loading && (
          <ActivityIndicator
            style={formStyles.buttonText}
            size="small"
            color="#000000"
          />
        )}
        {!loading && <Text style={formStyles.buttonText}>{t('login')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onGoogleButtonPress}
        style={[formStyles.buttonPrimary]}
        disabled={loading}
      >
        <Text style={formStyles.buttonText}>GOOGLE</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.login}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={commonAppStyles.textPrimary}>
          {t('noAccount')}
          <Text style={{ fontWeight: 'bold' }}> {t('registerYourself')}</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.login}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={commonAppStyles.textPrimary}>
          {t('forgotPassword')}
          <Text style={{ fontWeight: 'bold' }}> {t('resetIt')}</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
  },
  login: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
});

export default LogIn;
