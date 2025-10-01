import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
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
import {
  primaryBgColor,
  primaryColor,
  separatorColor,
  warningColor,
} from '../../utils/styles/colors';
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
import { LinearGradient } from 'expo-linear-gradient';

interface ActionButtonProps {
  icon: any;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'warning' | 'premium';
  showChevron?: boolean;
}

interface InfoItemProps {
  icon: any;
  label: string;
  value: string;
  iconColor?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  title,
  description,
  onPress,
  variant = 'default',
  showChevron = true,
}) => {
  const getVariantColors = () => {
    switch (variant) {
      case 'warning':
        return {
          background: 'rgba(254, 120, 120, 0.1)',
          border: 'rgba(254, 120, 120, 0.3)',
          iconColor: warningColor,
          textColor: warningColor,
        };
      case 'premium':
        return {
          background: 'rgba(255, 193, 7, 0.1)',
          border: 'rgba(255, 193, 7, 0.3)',
          iconColor: '#FFC107',
          textColor: '#FFC107',
        };
      default:
        return {
          background: 'rgba(16, 217, 185, 0.08)',
          border: 'rgba(16, 217, 185, 0.2)',
          iconColor: primaryColor,
          textColor: 'white',
        };
    }
  };

  const colors = getVariantColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.actionButtonContent}>
        <View style={styles.actionButtonLeft}>
          <View
            style={[
              styles.actionButtonIconContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <FontAwesomeIcon icon={icon} size={20} color={colors.iconColor} />
          </View>
          <View style={styles.actionButtonText}>
            <Text
              style={[styles.actionButtonTitle, { color: colors.textColor }]}
            >
              {title}
            </Text>
            {description && (
              <Text style={styles.actionButtonDescription}>{description}</Text>
            )}
          </View>
        </View>
        {showChevron && (
          <View style={styles.actionButtonRight}>
            <FontAwesomeIcon
              icon={Icons.ChevronRight}
              size={16}
              color={separatorColor}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  value,
  iconColor = primaryColor,
}) => (
  <View style={styles.infoItem}>
    <View style={styles.infoItemIcon}>
      <FontAwesomeIcon icon={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.infoItemContent}>
      <Text style={styles.infoItemLabel}>{label}</Text>
      <Text style={styles.infoItemValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  </View>
);

export const Account = () => {
  const { userData, premium } = useUserStore();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { unsubscribeNotifications, removePushToken } =
    useNotificationsHandler();
  const { currentPushToken } = useUserStore();

  const [isEditing, setIsEditing] = useState(false);

  const userDisplayName = useMemo(
    () => auth.currentUser?.displayName || t('anonymous-user'),
    [auth.currentUser?.displayName, t]
  );

  const userEmail = useMemo(
    () => auth.currentUser?.email || t('no-email'),
    [auth.currentUser?.email, t]
  );

  const formattedBirthDate = useMemo(() => {
    if (!userData?.dateOfBirth) return t('date-of-birth-not-set');
    return new Date(userData.dateOfBirth).toLocaleDateString();
  }, [userData?.dateOfBirth, t]);

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
      recipients: ['support@example.com'],
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
        showTitle
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
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={confirmSignOut}
            style={[styles.headerButton, styles.signOutButton]}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon
              icon={Icons.LogOut}
              size={20}
              color={warningColor}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('account')}</Text>

          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={[styles.headerButton, styles.editButton]}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon
              icon={Icons.Pencil}
              size={20}
              color={primaryColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {premium && (
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF6347']}
                style={styles.premiumRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <FastImage
              source={
                auth.currentUser?.photoURL
                  ? {
                      uri: auth.currentUser.photoURL,
                      priority: FastImage.priority.high,
                    }
                  : require('../../../../assets/userIcon.png')
              }
              style={styles.profileImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          <Text style={styles.displayName}>{userDisplayName}</Text>

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: premium ? '#FFD700' : primaryColor },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: premium ? '#FFD700' : primaryColor },
              ]}
            >
              {premium ? 'Premium' : 'Basic'}
            </Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesomeIcon icon={Icons.User} size={20} color={primaryColor} />
            <Text style={styles.cardTitle}>{t('about-me')}</Text>
          </View>

          <View style={styles.cardContent}>
            <InfoItem
              icon={Icons.Envelope}
              label={t('email')}
              value={userEmail}
            />

            <InfoItem
              icon={Icons.Calendar}
              label={t('date-of-birth')}
              value={formattedBirthDate}
            />
          </View>
        </BlurView>

        {/* Actions Card */}
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesomeIcon icon={Icons.Gear} size={20} color={primaryColor} />
            <Text style={styles.cardTitle}>{t('settings')}</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={{ gap: 16 }}>
              <ActionButton
                icon={Icons.Lock}
                title={t('change-password-title')}
                description={t('update-password')}
                onPress={() => navigation.navigate('PasswordChangeScreen')}
              />

              <ActionButton
                icon={Icons.Help}
                title={t('help')}
                description={t('contact-support')}
                onPress={handleHelpMail}
              />

              <ActionButton
                icon={Icons.Info}
                title={t('info')}
                description={t('app-information')}
                onPress={() => navigation.navigate('Info')}
              />
            </View>
          </View>
        </BlurView>

        {/* Danger Zone Card */}
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.cardContent}>
            <ActionButton
              icon={Icons.TrashCan}
              title={t('delete-account')}
              description={t('permanently-delete-account')}
              onPress={confirmDeleteAccount}
              variant="warning"
              showChevron={false}
            />
          </View>
        </BlurView>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },

  // Header
  header: {
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  signOutButton: {
    backgroundColor: 'rgba(254, 120, 120, 0.1)',
  },
  editButton: {
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra space for bottom tabs
  },

  // Enhanced Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 75,
    zIndex: 1,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: primaryBgColor,
    zIndex: 2,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: primaryBgColor,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  displayName: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Cards
  card: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // Info Items
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  infoItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoItemLabel: {
    color: separatorColor,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  infoItemValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Action Buttons - Fixed spacing
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    minHeight: 60,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionButtonRight: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  actionButtonIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  actionButtonDescription: {
    color: separatorColor,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 10,
  },
});
