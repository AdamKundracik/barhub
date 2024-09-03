import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
import Svg, { Path } from 'react-native-svg';
import { textInputPlaceholderColor } from '../../utils/styles/colors';
import { GoogleIcon } from '../../utils/icons/GoogleIcon';
import OSeparator from '../../components/auth/OSeparator';

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
    await signInWithCredential(auth, googleCredential);
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
      <View style={{ marginBottom: 50 }}>
        <View style={{ alignSelf: 'center' }}>
          <Svg width="348" height="90" viewBox="0 0 348 90" fill="none">
            <Path
              d="M35.2971 84.4969L35.297 90.0009L0.225006 90L0.22514 84.496L35.2971 84.4969ZM125.718 84.4991L125.718 90.0031L35.35 90.0009L35.3501 84.4969L47.7661 84.4972L47.7682 0.529183L82.5842 0.530033C88.6429 0.530181 93.8482 1.25564 98.2001 2.70642C102.637 4.15719 105.923 6.11994 108.056 8.59466C112.152 13.2028 114.2 18.4081 114.2 24.2108C114.199 31.2081 111.981 36.4134 107.543 39.8266C105.922 41.0213 104.813 41.7892 104.215 42.1306C103.618 42.3866 102.551 42.8559 101.015 43.5385C106.562 44.7333 110.956 47.2507 114.199 51.0908C117.527 54.8456 119.191 59.5389 119.191 65.1709C119.19 73.6189 115.862 80.0615 109.206 84.4987L125.718 84.4991ZM62.8703 76.0496L86.5503 76.0501C92.097 76.0503 96.321 75.197 99.2224 73.4904C102.209 71.6985 103.703 68.3706 103.703 63.5066C103.703 55.5706 97.3456 51.6024 84.6309 51.6021L62.8709 51.6016L62.8703 76.0496ZM62.8713 37.6496L82.0713 37.65C92.994 37.6503 98.4554 33.9384 98.4556 26.5144C98.4557 22.2478 97.1331 19.1757 94.4878 17.2983C91.8425 15.4209 87.7465 14.4822 82.1999 14.482L62.8719 14.4816L62.8713 37.6496ZM232.117 84.5017L232.117 90.0057L203.573 90.005L194.614 69.6528L149.814 69.6517L140.853 90.0035L112.309 90.0028L112.309 84.4988L127.157 84.4991L164.151 0.532025L180.279 0.532419L217.269 84.5013L232.117 84.5017ZM188.47 55.7006L172.215 18.8362L155.958 55.6998L188.47 55.7006ZM316.109 84.5037L316.109 90.0077L288.461 90.0071L267.086 59.9265L247.246 59.9261L247.245 90.0061L219.725 90.0054L219.725 84.5014L232.141 84.5017L232.143 0.533685L265.423 0.534498C279.077 0.534831 288.847 2.83907 294.735 7.44722C300.623 12.0554 303.567 19.4368 303.566 29.5914C303.566 44.3541 297.123 53.6553 284.238 57.495L303.693 84.5034L316.109 84.5037ZM266.062 46.2305C274.595 46.2307 280.398 44.9082 283.47 42.2629C286.542 39.6177 288.078 35.3937 288.078 29.5911C288.079 23.7031 286.5 19.6924 283.343 17.5589C280.185 15.3402 274.554 14.2307 266.447 14.2305L247.247 14.2301L247.246 46.2301L266.062 46.2305ZM347.922 84.5045L347.922 90.0085L312.85 90.0077L312.85 84.5037L347.922 84.5045Z"
              fill="white"
            />
          </Svg>
        </View>
        <View style={{ alignSelf: 'center' }}>
          <Svg width="146" height="45" viewBox="0 0 146 45" fill="none">
            <Path
              d="M50.6968 42.248V45H36.9368V26.696H14.7288V45H7.17675V0.263996H14.7288V19.656H36.9368V0.263996H44.4888V42.248H50.6968ZM7.17675 42.248H0.96875V45H7.17675V42.248ZM99.8708 42.248V45H50.7188V42.248H63.9668C58.8894 38.7067 56.3508 33.096 56.3508 25.416V0.263996H63.9028V25.096C63.9028 29.192 64.9268 32.4347 66.9748 34.824C69.0228 37.2133 71.7961 38.408 75.2948 38.408C78.7934 38.408 81.5668 37.2133 83.6147 34.824C85.6628 32.4347 86.6868 29.192 86.6868 25.096V0.263996H94.2388V25.416C94.2388 33.1387 91.6788 38.7493 86.5588 42.248H99.8708ZM145.028 42.248V45H99.8438V42.248H106.052V0.263996H123.46C126.489 0.263996 129.092 0.626663 131.268 1.352C133.486 2.07733 135.129 3.05866 136.196 4.296C138.244 6.6 139.268 9.20267 139.268 12.104C139.268 15.6027 138.158 18.2053 135.94 19.912C135.129 20.5093 134.574 20.8933 134.276 21.064C133.977 21.192 133.444 21.4267 132.676 21.768C135.449 22.3653 137.646 23.624 139.268 25.544C140.932 27.4213 141.764 29.768 141.764 32.584C141.764 36.808 140.1 40.0293 136.772 42.248H145.028ZM113.604 38.024H125.444C128.217 38.024 130.329 37.5973 131.78 36.744C133.273 35.848 134.02 34.184 134.02 31.752C134.02 27.784 130.841 25.8 124.484 25.8H113.604V38.024ZM113.604 18.824H123.204C128.665 18.824 131.396 16.968 131.396 13.256C131.396 11.1227 130.734 9.58667 129.412 8.648C128.089 7.70933 126.041 7.24 123.268 7.24H113.604V18.824Z"
              fill="#10D9B9"
            />
          </Svg>
        </View>
      </View>

      <InputWrapper inputLabel={t('email')}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={formStyles.inputPrimary}
          placeholder={t('email')}
          keyboardType={'email-address'}
          placeholderTextColor={textInputPlaceholderColor}
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
          placeholderTextColor={textInputPlaceholderColor}
        />
      </InputWrapper>

      <TouchableOpacity
        style={styles.textButtons}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={commonAppStyles.textSecondary}>{t('forgotPassword')}</Text>
      </TouchableOpacity>

      <OSeparator />

      <TouchableOpacity
        style={styles.googleIcom}
        onPress={onGoogleButtonPress}
        disabled={loading}
      >
        <GoogleIcon />
      </TouchableOpacity>

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
        style={styles.login}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={commonAppStyles.textSecondary}>
          {t('noAccount')}
          <Text
            style={[
              commonAppStyles.textPrimary,
              { textDecorationLine: 'underline' },
            ]}
          >
            {' '}
            {t('registerYourself')}
          </Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },

  login: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 15,
  },
  googleIcom: {
    alignSelf: 'center',
    width: 50,
    paddingVertical: 15,
    alignItems: 'center',
  },
  textButtons: {
    paddingHorizontal: 15,
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
});

export default LogIn;
