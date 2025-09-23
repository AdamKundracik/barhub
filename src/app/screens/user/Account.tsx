import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { primaryBgColor, warningColor } from '../../utils/styles/colors';
import EditProfile from '../../components/user/Account/EditProfile';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { Image } from 'expo-image';
import { auth } from '@/firebaseConfig';
import { useUserStore } from '@/src/app/utils/store/userStore';

export const Account = () => {
  const { userData, premium } = useUserStore();

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
                { borderWidth: 3, borderColor: '#00E1C9' }, // Green border for all, as in the design
                premium && {
                  borderColor: '#FFC107', // Gold for premium
                },
              ]}
              contentFit="cover"
            />
          </View>
          <Text style={styles.username}>{auth.currentUser?.displayName}</Text>
          <Text style={styles.accountStatusText}>
            {t('account-state')}:{' '}
            <Text style={premium ? styles.premiumText : styles.basicText}>
              {premium ? 'Premium' : 'Basic'}
            </Text>
          </Text>
        </View>

        {/* Moje údaje Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            {/* Toto je flex container */}
            <Text style={styles.cardTitle}>{t('about-me')}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesomeIcon
              icon={Icons.Envelope}
              size={16}
              color={'white'}
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>{t('email')}</Text>
              <Text style={styles.infoValue}>{auth.currentUser?.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <FontAwesomeIcon
              icon={Icons.Calendar}
              size={16}
              color={'white'}
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>{t('date-of-birth')}</Text>
              <Text style={styles.infoValue}>
                {userData?.dateOfBirth
                  ? new Date(userData?.dateOfBirth!).toLocaleDateString()
                  : t('date-of-birth-not-set')}
              </Text>
            </View>
          </View>
        </View>

        {/* Nastavenia účtu Section */}
        <View style={styles.card}>
          {/* Change Password Button */}
          <TouchableOpacity
            style={[styles.fullButton, styles.changePasswordButton]}
            onPress={() => navigation.navigate('PasswordChangeScreen')}
          >
            <FontAwesomeIcon
              icon={Icons.Lock}
              size={18}
              color={primaryBgColor}
              style={styles.buttonIcon}
            />
            <Text style={styles.changePasswordButtonText}>
              {t('change-password-title')}
            </Text>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            style={[styles.fullButton, styles.deleteAccountButton]}
            onPress={confirmDeleteAccount}
          >
            <FontAwesomeIcon
              icon={Icons.TrashCan}
              size={18}
              color={'white'}
              style={styles.buttonIconRight}
            />
            {/* Using Lock for delete as well, adjust if there's a specific delete icon */}
            <Text style={styles.deleteAccountButtonText}>
              {t('delete-account')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const commonColors = {
  white: '#fff',
  primaryTeal: '#00E1C9',
  premium: '#FFC107',
  darkGrayCard: 'rgba(58,58,58,0.8)', // Darker gray for cards
  lightGrayText: '#A9A9A9', // Lighter gray for labels
};

const commonTypography = {
  baseSize: 16,
  smallSize: 14,
  largeSize: 20,
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  container: {
    flex: 1, // Ensure container takes full height
    paddingHorizontal: 16,
    paddingTop: 20, // Add some padding from the top
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
    marginBottom: 30, // Increased margin for spacing
  },
  profilePicture: {
    width: 120, // Slightly smaller avatar for better spacing
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    // Border color is handled inline based on premium status
  },
  username: {
    color: commonColors.white, // Changed to white for better contrast
    fontSize: commonTypography.largeSize,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  accountStatusText: {
    color: commonColors.white,
    fontSize: commonTypography.baseSize,
  },
  premiumText: {
    color: commonColors.premium,
    fontWeight: 'bold',
  },
  basicText: {
    color: commonColors.white, // Basic text color remains white
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: commonColors.darkGrayCard, // Darker background for cards
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    color: commonColors.white,
    fontSize: commonTypography.largeSize,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 10,
    color: commonColors.primaryTeal, // Icons in info section are teal
  },
  infoLabel: {
    color: commonColors.primaryTeal, // Lighter gray for labels
    fontSize: commonTypography.smallSize,
  },
  infoValue: {
    color: commonColors.white,
    fontSize: commonTypography.baseSize,
    fontWeight: 'bold',
  },

  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  changePasswordButton: {
    backgroundColor: commonColors.white,
  },
  changePasswordButtonText: {
    color: primaryBgColor, // Text color for white button
    fontSize: commonTypography.baseSize,
    fontWeight: 'bold',
    marginLeft: 10, // Space for icon
  },
  deleteAccountButton: {
    backgroundColor: warningColor,
  },
  deleteAccountButtonText: {
    color: commonColors.white,
    fontSize: commonTypography.baseSize,
    fontWeight: 'bold',
    marginLeft: 10, // Space for icon
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonIconRight: {
    marginLeft: 10,
  },
});
export default Account;
