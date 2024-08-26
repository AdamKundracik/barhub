import {
  ActivityIndicator,
  Alert,
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
import { getAllExistingUsers } from '../../utils/services/functions';

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
    offlineAccess: true,
  });

  async function onGoogleButtonPress() {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken, user, scopes } = await GoogleSignin.signIn();
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const allUsers = await getAllExistingUsers();
    const userAccount = allUsers.data?.users.find(
      userAcc => userAcc.email === user.email
    );
    const userExists =
      userAccount && userAccount.providerData[0].providerId === 'password';

    // If exists, dont log in with google, else login with google
    if (userExists) {
      Alert.alert(
        'User already exists!',
        'User with this email already exists.\nLog in to your account.'
      );
    } else {
      // Sign-in the user with the credential
      await signInWithCredential(auth, googleCredential);
    }
  }

  async function onSignIn() {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password).catch(error => {
      switch (error.code) {
        case 'auth/invalid-login-credentials':
          alert(t('wrong-password'));
          setLoading(false);
          break;
        case 'auth/invalid-email':
          alert(t('invalid-email'));
          console.error('Invalid email');
          setLoading(false);
          break;
        case 'auth/user-not-found':
          alert(t('user-not-found'));
          console.error('User not found');
          setLoading(false);
          break;
        case 'auth/wrong-password':
          alert(t('wrong-password'));
          console.error('Wrong password');
          setLoading(false);
          break;
        case 'auth/email-already-in-use':
          alert(t('email-already-in-use'));
          console.error('Email already in use');
          setLoading(false);
          break;
        case 'auth/weak-password':
          alert(t('weak-password'));
          console.error('Weak password');
          setLoading(false);
          break;
        case 'auth/operation-not-allowed':
          alert(t('operation-not-allowed'));
          console.error('Operation not allowed');
          setLoading(false);
          break;
        case 'auth/account-exists-with-different-credential':
          alert(t('account-exists-with-different-credential'));
          console.error('Account exists with a different credential');
          setLoading(false);
          break;
        case 'auth/credential-already-in-use':
          alert(t('credential-already-in-use'));
          console.error('Credential already in use');
          setLoading(false);
          break;
        case 'auth/popup-closed-by-user':
          alert(t('popup-closed-by-user'));
          console.error('Popup closed by user');
          setLoading(false);
          break;
        case 'auth/popup-blocked':
          alert(t('popup-blocked'));
          console.error('Popup blocked');
          setLoading(false);
          break;
        case 'auth/invalid-action-code':
          alert(t('invalid-action-code'));
          console.error('Invalid action code');
          setLoading(false);
          break;
        case 'auth/expired-action-code':
          alert(t('expired-action-code'));
          console.error('Expired action code');
          setLoading(false);
          break;
        case 'auth/invalid-verification-code':
          alert(t('invalid-verification-code'));
          console.error('Invalid verification code');
          setLoading(false);
          break;
        case 'auth/invalid-verification-id':
          alert(t('invalid-verification-id'));
          console.error('Invalid verification ID');
          setLoading(false);
          break;
        case 'auth/requires-recent-login':
          alert(t('requires-recent-login'));
          console.error('Requires recent login');
          setLoading(false);
          break;
        case 'auth/session-expired':
          alert(t('session-expired'));
          console.error('Session expired');
          setLoading(false);
          break;
        default:
          alert(t('unknown-error'));
          console.error('Unknown error', error);
          setLoading(false);
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
