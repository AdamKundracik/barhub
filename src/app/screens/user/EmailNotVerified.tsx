import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Layout from '../../components/user/Shared/Layout';
import { commonAppStyles, formStyles } from '../../utils/styles/styles';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth } from '@/firebaseConfig';

const EmailNotVerified = () => {
  const { t } = useTranslation();

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        Alert.alert(t('Signed out'), t('You have been signed out'), [
          { text: 'Ok' },
        ]);
      })
      .catch(error => {
        console.error(error);
      });
  };

  return (
    <Layout pageTitle={'Email not verified'}>
      <View style={styles.container}>
        <Text style={styles.title}>Email not verified</Text>
        <Text style={styles.description}>
          Before we can log you in, you have to verify your email.
        </Text>
        <TouchableOpacity
          style={formStyles.buttonPrimary}
          onPress={handleSignOut}
        >
          <Text style={formStyles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...commonAppStyles.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    ...commonAppStyles.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default EmailNotVerified;
