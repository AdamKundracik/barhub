import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Layout from '../../components/user/Layout';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import 'firebase/functions';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useQueryClient } from 'react-query';
import { User } from '../../../../shared';
import { useUserContext } from '../../providers/UserProvider';

export const Account = () => {
  const user: User = useQueryClient().getQueryData('user')!;

  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  function triggerSignOut() {
    signOut(auth)
      .then(() => {
        Alert.alert(t('Signed out'), t('You have been signed out'), [
          { text: 'Ok' },
        ]);
      })
      .catch(error => {
        console.error(error);
      });
  }

  return (
    <Layout pageTitle={'Account'}>
      <View style={styles.container}>
        <Image
          source={
            auth.currentUser?.photoURL
              ? { uri: auth.currentUser.photoURL }
              : require('../../../../assets/userIcon.png')
          }
          style={styles.profilePicture}
        />
        <Text style={styles.userName}>{auth.currentUser?.displayName}</Text>
        <Text style={styles.userName}>{user?.email}</Text>
        <Text style={styles.picturesTaken}>Pictures taken: %PICTURES%</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Settings{' '}
            <FontAwesomeIcon
              icon={Icons.Gear}
              color={'white'}
            ></FontAwesomeIcon>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={triggerSignOut}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
  },
  picturesTaken: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default Account;
