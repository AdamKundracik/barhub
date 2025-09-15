import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { primaryBgColor, primaryColor } from '../../utils/styles/colors';
import EditProfile from '../../components/user/Account/EditProfile';
import { ScreenLayout } from '../../components/user/Shared/ScreenLayout';
import { Image } from 'expo-image';

export const Account = () => {
  const { userData } = useUserContext();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const handleDeleteUser = async () => {
    await auth.currentUser!.delete();
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      t('delete-account-title'),
      t('delete-account-info'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('submit'),
          style: 'destructive',
          onPress: handleDeleteUser,
        },
      ],
      { cancelable: true }
    );
  };

  if (isEditing) {
    return (
      <ScreenLayout
        title={t('edit-profile')}
        clickFunction={() => setIsEditing(false)}
      >
        <EditProfile
          user={userData ?? null}
          onEditCLose={() => setIsEditing(false)}
        />
      </ScreenLayout>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={Icons.Remove} size={28} color={'white'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <FontAwesomeIcon icon={Icons.Pencil} size={20} color={'white'} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <View>
            <Image
              source={
                auth.currentUser?.photoURL
                  ? { uri: auth.currentUser.photoURL }
                  : require('../../../../assets/userIcon.png')
              }
              style={[
                styles.profilePicture,
                userData?.premium && {
                  borderWidth: 1,
                  borderColor: '#FFC107',
                },
              ]}
              contentFit="cover"
            />
          </View>
          <Text style={styles.username}>{auth.currentUser?.displayName}</Text>
          <Text style={{ color: primaryColor }}>{t('account-state')}</Text>
          <View style={styles.accountStatus}>
            {userData?.premium && (
              <FontAwesomeIcon icon={Icons.Crown} size={20} color="#FFC107" />
            )}
            <Text
              style={userData?.premium ? styles.premiumText : styles.basicText}
            >
              {userData?.premium ? 'Premium' : 'Basic'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>{t('email')}</Text>
        <Text style={styles.value}>{auth.currentUser?.email}</Text>
        <Text style={styles.label}>{t('date-of-birth')}</Text>
        <Text style={styles.value}>
          {userData?.dateOfBirth
            ? new Date(userData?.dateOfBirth!).toLocaleDateString()
            : t('date-of-birth-not-set')}
        </Text>

        {/* Change Password */}
        <TouchableOpacity
          style={{ marginBottom: 15 }}
          onPress={() => navigation.navigate('PasswordChangeScreen')}
        >
          <Text style={styles.changePassword}>
            {t('change-password-title')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmDeleteAccount}>
          <Text style={styles.deleteAccount}>{t('delete-account')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const commonColors = {
  white: '#fff',
  primaryTeal: '#00E1C9',
  premium: '#FFC107',
  deleteRed: '#FE7878',
};

const commonTypography = {
  baseSize: 16,
  smallSize: 14,
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  container: {
    paddingHorizontal: 10,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
  },

  profileSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  premiumBorder: {
    borderWidth: 1,
    borderColor: commonColors.premium,
  },

  username: {
    color: commonColors.primaryTeal,
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 8,
    marginBottom: 10,
  },
  accountStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumText: {
    color: commonColors.premium,
    marginLeft: 4,
    fontSize: commonTypography.baseSize,
  },
  basicText: {
    color: 'white',
    marginLeft: 4,
    fontSize: commonTypography.baseSize,
  },

  infoSection: {
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  label: {
    color: commonColors.white,
    fontSize: commonTypography.smallSize,
    marginTop: 16,
  },
  value: {
    color: commonColors.primaryTeal,
    fontSize: commonTypography.baseSize,
    marginBottom: 8,
  },
  changePassword: {
    color: 'white',
    textAlign: 'center',
    marginTop: 24,
    textDecorationLine: 'underline',
    fontSize: commonTypography.baseSize,
  },
  deleteAccount: {
    color: commonColors.deleteRed,
    fontSize: commonTypography.baseSize,
    textAlign: 'center',
  },
});
export default Account;
