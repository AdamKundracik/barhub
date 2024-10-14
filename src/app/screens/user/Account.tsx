import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Layout from '../../components/user/Shared/Layout';
import { auth } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { DeleteUserModal } from '../../components/user/Account/DeleteUserModal';
import FastImage from 'react-native-fast-image';
import { primaryColor } from '../../utils/styles/colors';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import EditProfile from '../../components/user/Account/EditProfile';

export const Account = () => {
  const { userData, fetchUserData, fetchAllUsers } = useUserContext();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const [modalOpened, setModalOpened] = useState(false);

  const navigation = useNavigation<NavigationProp<UserStackList>>();

  if (isEditing) {
    return (
      <Layout pageTitle="Edit Account" showBottomTabs={false}>
        <EditProfile
          user={userData ?? null}
          onEditCLose={() => setIsEditing(false)}
        />
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Account" showBottomTabs={false}>
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={Icons.Remove} size={28} color={'white'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <FontAwesomeIcon icon={Icons.Pencil} size={16} color={'white'} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <View>
            <FastImage
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
              resizeMode="cover"
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
      </>

      {/* User Info Section */}
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

        <TouchableOpacity onPress={() => setModalOpened(true)}>
          <Text style={styles.deleteAccount}>{t('delete-account')}</Text>
        </TouchableOpacity>
      </View>
      <DeleteUserModal
        isOpen={modalOpened}
        onClose={() => setModalOpened(false)}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#0E0F1F',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  titlePrimary: {
    color: 'white',
  },
  titleSecondary: {
    color: '#00E1C9',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  username: {
    color: '#00E1C9',
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
    color: '#FFC107',
    marginLeft: 4,
    fontSize: 16,
  },
  basicText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 16,
  },

  deleteAccount: {
    color: '#FE7878',
    fontSize: 16,
    textAlign: 'center',
  },
  infoSection: {
    justifyContent: 'center',
  },

  label: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
  },
  value: {
    color: '#00E1C9',
    fontSize: 16,
    marginBottom: 8,
  },
  changePassword: {
    color: 'white',
    textAlign: 'center',
    marginTop: 24,
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bottomAvatar: {
    borderWidth: 2,
    borderColor: '#FFC107',
  },
});

export default Account;
