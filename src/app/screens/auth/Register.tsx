import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AuthLayout from '../../components/auth/AuthLayout';
import * as React from 'react';
import { useState } from 'react';
import { commonAppStyles, formStyles } from '../../utils/styles/styles';
import { InputWrapper } from '../../components/shared/InputWrapper';
import { useTranslation } from 'react-i18next';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { auth } from '../../../../firebaseConfig';
import { primaryColor, primaryTextColor } from '../../utils/styles/colors';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path } from 'react-native-svg';
import DatePicker from '../../components/shared/DatePicker';
import { setUser } from '../../utils/services/functions';
import { uploadProfilePhotoAsync } from '../../utils/helper-functions/imageUploadFunctions';

export const Register = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [togglePassword, setTogglePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [username, setUserName] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [acceptsTermsOfUse, setAcceptsTermsOfUse] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.granted) {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } else {
      console.log('Permission to access media library was denied.');
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
  };

  async function handleRegister() {
    setLoading(true);
    await createUserWithEmailAndPassword(auth, email, password).catch(error => {
      setLoading(false);
      switch (error.code) {
        case 'auth/email-already-in-use':
          alert(t(`email-in-use`));
          console.error(`Email already in use.`);
          break;
        case 'auth/invalid-email':
          alert(t(`invalid-email`));
          console.error(`Email is invalid.`);
          break;
        case 'auth/operation-not-allowed':
          alert(t(`sing-up-error`));
          console.error(`Error during sign up.`);
          break;
        default:
          alert(error.message);
          console.error(error.message);
          break;
      }
    });
    await sendEmailVerification(auth.currentUser as any);
    if (image && auth.currentUser) {
      const url = await uploadProfilePhotoAsync(image);
      await updateProfile(auth.currentUser, {
        displayName: username,
        photoURL: url,
      });
    } else if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: username,
      });
    }

    await setUser({
      displayName: username,
      photoURL: image,
      dateOfBirth: date,
      acceptTermsOfUse: acceptsTermsOfUse,
    });
  }

  function isSamePassword(): boolean {
    return password === repeatPassword;
  }

  async function handleSetUserAccount() {
    if (
      email &&
      username &&
      date &&
      password &&
      repeatPassword &&
      acceptsTermsOfUse &&
      isSamePassword()
    ) {
      await handleRegister();
    } else {
      Alert.alert('Error', 'Invalid form');
    }
  }

  return (
    <AuthLayout pageTitle={t('Register')}>
      <View style={styles.container}>
        {image ? (
          <TouchableOpacity onPress={pickImage}>
            <Image source={{ uri: image }} style={styles.profilePicture} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={pickImage}>
            <View>
              <Svg width="200" height="209" viewBox="0 0 200 209" fill="none">
                <Circle
                  cx="100"
                  cy="100"
                  r="97"
                  fill="#031824"
                  stroke="#10D9B9"
                  stroke-width="6"
                />
                <Path
                  d="M121.666 107.558L119.148 109.821L122.345 110.934C131.86 114.247 140.115 120.452 145.966 128.691C151.817 136.93 154.975 146.795 155 156.919C155 158.004 154.57 159.043 153.809 159.808C153.049 160.572 152.019 161 150.947 161C149.876 161 148.846 160.572 148.085 159.808C147.324 159.043 146.895 158.003 146.895 156.917V156.915C146.884 146.147 142.622 135.82 135.043 128.203C127.463 120.585 117.183 116.299 106.459 116.288H106.457H92.5434H92.5413C81.8172 116.299 71.5374 120.585 63.9573 128.203C56.3775 135.82 52.1162 146.147 52.1053 156.915V156.917C52.1053 158.003 51.6759 159.043 50.9148 159.808C50.154 160.572 49.1242 161 48.0526 161C46.981 161 45.9513 160.572 45.1905 159.808C44.4297 159.043 44.0003 158.004 44 156.918C44.0139 146.812 47.1493 136.96 52.972 128.723C58.7949 120.486 67.0175 114.27 76.5036 110.932L79.6849 109.812L77.1767 107.558C72.1385 103.029 68.586 97.0682 66.9909 90.4636C65.3959 83.859 65.834 76.9232 68.2469 70.5747C70.6598 64.2262 74.9332 58.7653 80.5 54.9134C86.0668 51.0617 92.6649 49 99.4214 49C106.178 49 112.776 51.0617 118.343 54.9134C123.91 58.7653 128.183 64.2262 130.596 70.5747C133.009 76.9232 133.447 83.859 131.852 90.4636C130.257 97.0682 126.704 103.029 121.666 107.558ZM54.1053 156.917C54.1157 146.675 58.1687 136.856 65.375 129.614C72.5813 122.371 82.3522 118.298 92.5434 118.288H106.457C116.648 118.298 126.419 122.371 133.625 129.614C140.831 136.856 144.884 146.675 144.895 156.917H54.1053ZM113.397 61.7348C109.261 58.9575 104.398 57.4744 99.4214 57.4744C92.7481 57.4744 86.3502 60.1387 81.6346 64.8778C79.2997 67.2243 77.4482 70.0094 76.1851 73.0739C74.922 76.1385 74.272 79.4226 74.272 82.7391C74.272 87.7337 75.7457 92.617 78.5079 96.7715C81.2702 100.926 85.1973 104.166 89.7939 106.079C94.3906 107.993 99.4492 108.493 104.33 107.518C109.21 106.542 113.692 104.134 117.208 100.6C120.725 97.0664 123.118 92.565 124.088 87.6661C125.057 82.7672 124.56 77.6892 122.658 73.0739C120.755 68.4586 117.533 64.5121 113.397 61.7348Z"
                  fill="#10D9B9"
                  stroke="#031824"
                  stroke-width="4"
                />
                <Path
                  d="M172.5 158C157.339 158 145 169.441 145 183.5C145 197.559 157.339 209 172.5 209C187.661 209 200 197.559 200 183.5C200 169.441 187.661 158 172.5 158ZM183.486 185.513H174.671V193.687C174.671 194.801 173.701 195.7 172.5 195.7C171.299 195.7 170.329 194.801 170.329 193.687V185.513H161.514C160.313 185.513 159.343 184.614 159.343 183.5C159.343 182.386 160.313 181.487 161.514 181.487H170.329V173.313C170.329 172.199 171.299 171.3 172.5 171.3C173.701 171.3 174.671 172.199 174.671 173.313V181.487H183.486C184.687 181.487 185.657 182.386 185.657 183.5C185.657 184.614 184.68 185.513 183.486 185.513Z"
                  fill="#10D9B9"
                />
              </Svg>
            </View>
          </TouchableOpacity>
        )}
      </View>
      <InputWrapper inputLabel={t('email')}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={formStyles.inputPrimary}
          placeholder="Email"
          keyboardType={'email-address'}
          placeholderTextColor={primaryTextColor}
        />
      </InputWrapper>
      <InputWrapper inputLabel={t('user-name')}>
        <TextInput
          value={username}
          onChangeText={setUserName}
          style={formStyles.inputPrimary}
          placeholder={t('user-name')}
          keyboardType={'default'}
          placeholderTextColor={primaryTextColor}
        />
      </InputWrapper>
      <DatePicker onDateChange={handleDateChange} />
      <InputWrapper
        inputLabel={t('password')}
        setTogglePassword={setTogglePassword}
        togglePassword={togglePassword}
        passwordInput
      >
        <TextInput
          secureTextEntry={togglePassword}
          value={password}
          onChangeText={setPassword}
          style={formStyles.inputPrimary}
          placeholder={t('password')}
          keyboardType={'visible-password'}
          placeholderTextColor={primaryTextColor}
        />
      </InputWrapper>
      <InputWrapper
        inputLabel={t('repeatPassword')}
        setTogglePassword={setTogglePassword}
        togglePassword={togglePassword}
        passwordInput
      >
        <TextInput
          secureTextEntry={togglePassword}
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          style={formStyles.inputPrimary}
          placeholder={t('repeatPassword')}
          keyboardType={'visible-password'}
          placeholderTextColor={primaryTextColor}
        />
        {!isSamePassword() && (
          <View>
            <Text style={[commonAppStyles.textPrimary, { color: '#f80202' }]}>
              {t('noMatchingPasswords')}
            </Text>
          </View>
        )}
      </InputWrapper>
      <InputWrapper>
        <BouncyCheckbox
          style={{ padding: 5 }}
          fillColor={primaryColor}
          text={t('accept-terms')}
          textStyle={{ color: 'white', fontSize: 12 }}
          isChecked={acceptsTermsOfUse}
          onPress={() => setAcceptsTermsOfUse(!acceptsTermsOfUse)}
        ></BouncyCheckbox>
      </InputWrapper>
      <TouchableOpacity
        onPress={handleSetUserAccount}
        style={formStyles.buttonPrimary}
        disabled={!isSamePassword()}
      >
        {!loading ? (
          <Text style={formStyles.buttonText}>{t('register')}</Text>
        ) : (
          <ActivityIndicator
            style={formStyles.buttonText}
            size="small"
            color="#000000"
          />
        )}
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  login: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  profilePicture: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  checkbox: {
    alignSelf: 'center',
  },
  label: {
    margin: 8,
  },
});
export default Register;
