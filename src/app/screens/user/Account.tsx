import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
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
import { auth } from '@/firebaseConfig';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import FastImage from 'react-native-fast-image';
import * as MailComposer from 'expo-mail-composer';
import { BlurView } from 'expo-blur';
import { signOut } from 'firebase/auth';
import { useNotificationsHandler } from '@/src/app/components/user/NewsFeed/NotificationHandler';

export const Account = () => {
  const { userData, premium } = useUserStore();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { unsubscribeNotifications, removePushToken } =
    useNotificationsHandler();
  const { currentPushToken } = useUserStore();

  const [isEditing, setIsEditing] = useState(false);

  const handleDeleteUser = async () => {
    try {
      await auth.currentUser!.delete();
      showSuccessToast(t('account-deleted-success'));
    } catch {
      showErrorToast(t('something-went-wrong'));
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      t('delete-account-title'),
      t('delete-account-info'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('submit'), style: 'destructive', onPress: handleDeleteUser },
      ],
      { cancelable: true }
    );
  };

  const confirmSignOut = () => {
    Alert.alert(
      t('signed-out'),
      t('sign-out-info'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('submit'), style: 'destructive', onPress: handleSignOut },
      ],
      { cancelable: true }
    );
  };

  const handleHelpMail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(t('error'), t('mailer-not-available'));
      return;
    }

    await MailComposer.composeAsync({
      recipients: ['support@example.com'], // zmeniť na tvoj support e-mail
      subject: t('help-request'),
      body: t('please-describe-your-issue'),
    });
  };

  const handleSignOut = async () => {
    unsubscribeNotifications();
    await removePushToken(currentPushToken ?? '');
    await signOut(auth)
      .then(async () => {
        showSuccessToast(t('you-have-been-signed-out'));
      })
      .catch(console.error);
  };

  if (isEditing) {
    return (
      <ScreenLayout
        title={t('edit-profile')}
        showBackButton
        onBackPress={() => setIsEditing(false)}
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={confirmSignOut} style={styles.topButton}>
          <FontAwesomeIcon icon={Icons.LogOut} size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={styles.topButton}
        >
          <FontAwesomeIcon icon={Icons.Pencil} size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <FastImage
            source={
              auth.currentUser?.photoURL
                ? {
                    uri: auth.currentUser.photoURL,
                    priority: FastImage.priority.normal,
                  }
                : require('../../../../assets/userIcon.png')
            }
            style={[
              styles.profilePicture,
              { borderColor: premium ? '#FFC107' : '#00E1C9' },
            ]}
            resizeMode={FastImage.resizeMode.cover}
          />
          <Text style={styles.username}>{auth.currentUser?.displayName}</Text>
          <Text style={styles.accountStatusText}>
            {t('account-state')}:{' '}
            <Text style={premium ? styles.premiumText : styles.basicText}>
              {premium ? 'Premium' : 'Basic'}
            </Text>
          </Text>
        </View>

        {/* Account Info Section */}
        <BlurView intensity={30} tint="light" style={styles.card}>
          <Text style={styles.cardTitle}>{t('about-me')}</Text>
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
                  ? new Date(userData.dateOfBirth).toLocaleDateString()
                  : t('date-of-birth-not-set')}
              </Text>
            </View>
          </View>
          <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={handleHelpMail}>
              <View style={styles.left}>
                <FontAwesomeIcon icon={Icons.Help} size={18} color={'white'} />
                <Text style={styles.label}>{t('help')}</Text>
              </View>
              <FontAwesomeIcon
                icon={Icons.ChevronRight}
                size={18}
                color={'white'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Info')}
            >
              <View style={styles.left}>
                <FontAwesomeIcon icon={Icons.Info} size={18} color={'white'} />
                <Text style={styles.label}>{t('info')}</Text>
              </View>
              <FontAwesomeIcon
                icon={Icons.ChevronRight}
                size={18}
                color={'white'}
              />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Account Actions Section */}
        <BlurView intensity={30} tint="light" style={styles.card}>
          <TouchableOpacity
            style={[styles.fullButton, styles.whiteButton]}
            onPress={() => navigation.navigate('PasswordChangeScreen')}
          >
            <FontAwesomeIcon
              icon={Icons.Lock}
              size={18}
              color={primaryBgColor}
              style={styles.buttonIcon}
            />
            <Text style={styles.whiteButtonText}>
              {t('change-password-title')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fullButton, styles.deleteButton]}
            onPress={confirmDeleteAccount}
          >
            <FontAwesomeIcon
              icon={Icons.TrashCan}
              size={18}
              color={'white'}
              style={styles.buttonIconRight}
            />
            <Text style={styles.deleteButtonText}>{t('delete-account')}</Text>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </SafeAreaView>
  );
};

const commonColors = {
  white: '#fff',
  primaryTeal: '#00E1C9',
  premium: '#FFC107',
  darkGrayCard: 'rgba(58,58,58,0.8)',
};

const commonTypography = {
  baseSize: 16,
  smallSize: 14,
  largeSize: 20,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: primaryBgColor },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },

  container: {
    flexDirection: 'column',
    gap: 12, // spacing between rows
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between', // left + right
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // space between icon and label
  },
  label: {
    color: 'white',
    fontSize: 16,
  },
  topButton: { flexDirection: 'row', alignItems: 'center' },
  topButtonText: { color: 'white', marginLeft: 5, fontWeight: 'bold' },

  profileSection: { alignItems: 'center', marginBottom: 30 },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 3,
  },
  username: {
    color: commonColors.white,
    fontSize: commonTypography.largeSize,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  accountStatusText: {
    color: commonColors.white,
    fontSize: commonTypography.baseSize,
  },
  premiumText: { color: commonColors.premium, fontWeight: 'bold' },
  basicText: { color: commonColors.white, fontWeight: 'bold' },

  card: {
    // backgroundColor: commonColors.darkGrayCard,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    gap: 10,
    overflow: 'hidden',
  },
  cardTitle: {
    color: commonColors.white,
    fontSize: commonTypography.largeSize,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoIcon: { marginRight: 10, color: commonColors.primaryTeal },
  infoLabel: {
    color: commonColors.primaryTeal,
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
  whiteButton: { backgroundColor: commonColors.white, marginBottom: 10 },
  whiteButtonText: {
    color: primaryBgColor,
    fontSize: commonTypography.baseSize,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  deleteButton: { backgroundColor: warningColor, marginBottom: 10 },
  deleteButtonText: {
    color: commonColors.white,
    fontSize: commonTypography.baseSize,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonIcon: { marginRight: 5 },
  buttonIconRight: { marginLeft: 10 },
});
