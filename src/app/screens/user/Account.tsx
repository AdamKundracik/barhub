import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
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
import { useThemeColors } from '../../utils/styles/themeColors';
import EditProfile from '../../components/user/Account/EditProfile';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useUserData } from '@/src/app/hooks/useUserQuery';
import { AuthTypeEnum } from '@/src/app/types/dto';
import { useQueryClient } from 'react-query';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import * as MailComposer from 'expo-mail-composer';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../providers/AuthProvider';
import { userService } from '@/src/app/services/userService';
import { useUserRole } from '@/src/app/hooks/useUserRole';
import { useUserHighlights } from '@/src/app/hooks/useUserHighlights';
import { HighlightedPostsGrid } from '@/src/app/components/user/Profile/HighlightedPostsGrid';
import BioEditModal from '@/src/app/components/shared/Modals/BioEditModal';
import { DeleteAccountConfirmModal } from '@/src/app/components/shared/Modals/DeleteAccountConfirmModal';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';
import { addCacheBuster, createImageKey } from '../../utils/cache/imageCacheUtils';

interface ActionButtonProps {
  icon: any;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'warning' | 'premium';
  showChevron?: boolean;
  loading?: boolean;
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
  loading = false,
}) => {
  const themeColors = useThemeColors();
  
  const getVariantColors = () => {
    switch (variant) {
      case 'warning':
        return {
          background: themeColors.warningColor + '1A', // ~10% opacity
          border: themeColors.warningColor + '4D', // ~30% opacity
          iconColor: themeColors.warningColor,
          textColor: themeColors.warningColor,
        };
      case 'premium':
        return {
          background: '#FFC107' + '1A', // ~10% opacity
          border: '#FFC107' + '4D', // ~30% opacity
          iconColor: '#FFC107',
          textColor: '#FFC107',
        };
      default:
        return {
          background: themeColors.primaryColor + '14', // ~8% opacity
          border: themeColors.primaryColor + '33', // ~20% opacity
          iconColor: themeColors.primaryColor,
          textColor: themeColors.primaryTextColor,
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
      onPress={loading ? undefined : onPress}
      disabled={loading}
    >
      <View style={styles.actionButtonContent}>
        <View style={styles.actionButtonLeft}>
          <View
            style={[
              styles.actionButtonIconContainer,
              {
                backgroundColor: colors.background,
                borderColor: themeColors.primaryTextColor + '1A', // ~10% opacity
              },
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
              <Text style={[styles.actionButtonDescription, { color: themeColors.secondaryTextColor }]}>{description}</Text>
            )}
          </View>
        </View>
        {loading ? (
          <View style={styles.actionButtonRight}>
            <ActivityIndicator size="small" color={colors.iconColor} />
          </View>
        ) : showChevron ? (
          <View style={styles.actionButtonRight}>
            <FontAwesomeIcon
              icon={Icons.ChevronRight}
              size={16}
              color={themeColors.separatorColor}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  value,
  iconColor,
}) => {
  const themeColors = useThemeColors();
  const defaultIconColor = iconColor || themeColors.primaryColor;
  
  return (
  <View style={styles.infoItem}>
    <View
      style={[
        styles.infoItemIcon,
        {
          backgroundColor: themeColors.primaryColor + '1A', // ~10% opacity
        },
      ]}
    >
      <FontAwesomeIcon icon={icon} size={18} color={defaultIconColor} />
    </View>
    <View style={styles.infoItemContent}>
      <Text style={[styles.infoItemLabel, { color: themeColors.secondaryTextColor }]}>{label}</Text>
      <Text style={[styles.infoItemValue, { color: themeColors.primaryTextColor }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  </View>
  );
};

export const Account = () => {
  const {
    userData,
    isPremium,
    displayName,
    email,
    photoUrl,
    deleteAccountAsync,
    isDeletingAccount,
    refetch,
  } = useUserData();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const colors = useThemeColors();
  const { currentPushToken, getUserId } = useUserStore();
  const queryClient = useQueryClient();
  const { isAdmin, isModerator } = useUserRole();
  const userId = getUserId();
  const { highlights, isLoading: isLoadingHighlights } = useUserHighlights(
    userId || undefined
  );

  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isUpdatingBio, setIsUpdatingBio] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries(['user', 'data']);
      // Posts invalidation removed - only needed after profile photo change (handled in EditProfile)
      await refetch();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBioSave = async (newBio: string) => {
    setIsUpdatingBio(true);
    try {
      // Update bio via userService
      await userService.updateBio(newBio);

      // Update local user data
      const { updateUserData } = useUserStore.getState();
      updateUserData({ bio: newBio });

      showSuccessToast(
        t('bio.save-success-title') || 'Success',
        t('bio.save-success-message') || 'Bio updated successfully!'
      );
    } catch (error) {
      console.error('Error updating bio:', error);
      throw error; // Re-throw to be handled by modal
    } finally {
      setIsUpdatingBio(false);
    }
  };

  const userDisplayName = useMemo(
    () => displayName || t('anonymous-user'),
    [displayName, t]
  );

  const userEmail = useMemo(() => email || t('no-email'), [email, t]);

  const formattedBirthDate = useMemo(() => {
    if (!userData?.dateOfBirth) return t('date-of-birth-not-set');
    return new Date(userData.dateOfBirth).toLocaleDateString();
  }, [userData?.dateOfBirth, t]);

  // Check if user can change password (only for EMAIL_PASSWORD auth type)
  const canChangePassword = useMemo(() => {
    return userData?.authType === AuthTypeEnum.EMAIL_PASSWORD;
  }, [userData?.authType]);

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
      recipients: ['support@barhubapp.com'],
      subject: t('help-request'),
      body: t('please-describe-your-issue'),
    });
  };

  const handleSignOut = async () => {
    try {
      // Use new backend logout (push token removal is handled in AuthProvider)
      await logout();
      showSuccessToast(t('you-have-been-signed-out'));
    } catch (error) {
      console.error('Error signing out:', error);
      showErrorToast(t('error-signing-out'));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // First remove push token from backend (before account deletion)
      if (currentPushToken && userData?.id) {
        try {
          // // console.log('[Account] Removing push token before account deletion');
          await userService.removePushToken(
            userData.id.toString(),
            currentPushToken
          );
        } catch (error) {
          console.error('[Account] Error removing push token:', error);
          // Continue with account deletion even if push token removal fails
        }
      }

      // Delete account via backend API
      await deleteAccountAsync();

      // Close modal and logout after successful deletion
      setIsDeleteAccountModalOpen(false);
      await logout();
      showSuccessToast(t('account-deleted-successfully'));
    } catch (error) {
      console.error('Error deleting account:', error);
      showErrorToast(t('error-deleting-account'));
    }
  };

  const confirmDeleteAccount = () => {
    setIsDeleteAccountModalOpen(true);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.primaryBgColor }]}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={confirmSignOut}
            style={[
              styles.headerButton,
              styles.signOutButton,
              {
                backgroundColor: colors.primaryTextColor + '14', // ~8% opacity
              },
            ]}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon
              icon={Icons.LogOut}
              size={20}
              color={colors.warningColor}
            />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.primaryTextColor }]}>{t('account')}</Text>

          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={[
              styles.headerButton,
              styles.editButton,
              {
                backgroundColor: colors.primaryColor + '1A', // ~10% opacity
              },
            ]}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon
              icon={Icons.Pencil}
              size={20}
              color={colors.primaryColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryColor}
            colors={[colors.primaryColor]}
          />
        }
      >
        {/* Enhanced Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Avatar
              size="xl"
              style={[
                styles.avatarContainer,
                { borderColor: colors.separatorColor },
                // Show premium border only if premium UI is enabled and user is premium
                PremiumHelpers.shouldShowPremiumBorders() &&
                  isPremium &&
                  styles.premiumBorder,
              ]}
            >
              {photoUrl ? (
                <AvatarImage
                  key={createImageKey('account', userId, photoUrl)}
                  source={{
                    uri: addCacheBuster(photoUrl, userId),
                  }}
                  style={[styles.avatarImage, { borderColor: colors.separatorColor }]}
                />
              ) : (
                <AvatarFallbackText className={'text-white'}>
                  {userDisplayName}
                </AvatarFallbackText>
              )}
            </Avatar>
          </View>

          <Text style={[styles.displayName, { color: colors.primaryTextColor }]}>{userDisplayName}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {/* Premium Badge - only show if premium UI is enabled */}
            {PremiumHelpers.shouldShowPremiumBadges() && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: colors.primaryTextColor + '0D', // ~5% opacity
                    borderColor: colors.primaryTextColor + '1A', // ~10% opacity
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isPremium ? '#FFD700' : colors.primaryColor },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isPremium ? '#FFD700' : colors.primaryColor },
                  ]}
                >
                  {isPremium ? 'Premium' : 'Basic'}
                </Text>
              </View>
            )}

            {/* Role Badge */}
            {(isAdmin || isModerator) && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isAdmin
                      ? '#EF4444' + '26' // ~15% opacity
                      : '#3B82F6' + '26', // ~15% opacity
                    borderColor: isAdmin
                      ? '#EF4444' + '4D' // ~30% opacity
                      : '#3B82F6' + '4D', // ~30% opacity
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isAdmin ? '#EF4444' : '#3B82F6',
                      marginLeft: 4,
                    },
                  ]}
                >
                  {isAdmin ? 'ADMIN' : 'MODERATOR'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Information Card */}
        <BlurView
          intensity={20}
          tint="dark"
          style={[
            styles.card,
            {
              borderColor: colors.primaryTextColor + '14', // ~8% opacity
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <FontAwesomeIcon icon={Icons.User} size={20} color={colors.primaryColor} />
            <Text style={[styles.cardTitle, { color: colors.primaryTextColor }]}>{t('about-me')}</Text>
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

            {/* Bio Section */}
            <View style={[styles.bioSection, { borderTopColor: colors.separatorColor }]}>
              <View style={styles.bioHeader}>
                <Text style={[styles.bioLabel, { color: colors.secondaryTextColor }]}>{t('bio.label') || 'Bio'}</Text>
                <TouchableOpacity
                  style={[
                    styles.editBioButton,
                    {
                      backgroundColor: colors.primaryColor + '26', // ~15% opacity
                      borderColor: colors.primaryColor + '4D', // ~30% opacity
                    },
                  ]}
                  onPress={() => setIsBioModalOpen(true)}
                >
                  <Text style={[styles.editBioText, { color: colors.primaryColor }]}>{t('bio.edit')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bioContent}>
                <Text style={[styles.bioText, { color: colors.primaryTextColor }]}>
                  {userData?.bio || t('bio.no-bio') || 'No bio yet'}
                </Text>
              </View>
            </View>

            {/* View Profile Detail Button */}
            <View style={{ marginTop: 16 }}>
              <ActionButton
                icon={Icons.Info}
                title={t('user.profile')}
                description={t('view-profile-detail')}
                onPress={() =>
                  (navigation as any).navigate('UserDetail', { userId: userId })
                }
              />
            </View>
          </View>
        </BlurView>

        {/* Highlighted Posts Grid */}
        <HighlightedPostsGrid
          highlights={highlights}
          isLoading={isLoadingHighlights}
        />

        {/* Admin Panel Card (Admin/Moderator only) */}
        {(isAdmin || isModerator) && (
          <BlurView
            intensity={20}
            tint="dark"
            style={[
              styles.card,
              {
                borderColor: colors.primaryTextColor + '14', // ~8% opacity
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <FontAwesomeIcon
                icon={Icons.ShieldHalved}
                size={20}
                color={isAdmin ? '#EF4444' : '#3B82F6'}
              />
              <Text style={[styles.cardTitle, { color: colors.primaryTextColor }]}>Admin Panel</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={{ gap: 16 }}>
                <ActionButton
                  icon={Icons.Users}
                  title={t('admin.userManagement')}
                  description={t('admin.userManagementDesc')}
                  onPress={() => navigation.navigate('AdminPanel' as never)}
                  variant="premium"
                />

                <ActionButton
                  icon={Icons.Warning}
                  title={t('admin.reportsManagement')}
                  description={t('admin.reportsManagementDesc')}
                  onPress={() =>
                    navigation.navigate('ReportsManagement' as never)
                  }
                  variant="warning"
                />

                {isAdmin && (
                  <ActionButton
                    icon={Icons.ShieldHalved}
                    title={t('admin.consentManagement')}
                    description={t('admin.consentManagementDesc')}
                    onPress={() =>
                      navigation.navigate('ConsentManagement' as never)
                    }
                    variant="default"
                  />
                )}
              </View>
            </View>
          </BlurView>
        )}

        {/* Actions Card */}
        <BlurView
          intensity={20}
          tint="dark"
          style={[
            styles.card,
            {
              borderColor: colors.primaryTextColor + '14', // ~8% opacity
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <FontAwesomeIcon icon={Icons.Gear} size={20} color={colors.primaryColor} />
            <Text style={[styles.cardTitle, { color: colors.primaryTextColor }]}>{t('settings')}</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={{ gap: 16 }}>
              {canChangePassword && (
                <ActionButton
                  icon={Icons.Lock}
                  title={t('change-password-title')}
                  description={t('update-password')}
                  onPress={() => navigation.navigate('PasswordChangeScreen')}
                />
              )}

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

              <ActionButton
                icon={Icons.ShieldHalved}
                title={t('privacy.privacy-and-data')}
                description={t('privacy.privacy-data-description')}
                onPress={() => navigation.navigate('PrivacyData' as never)}
              />

              <ActionButton
                icon={Icons.Ban}
                title={t('blockedUsers.title')}
                description={t('blockedUsers.description')}
                onPress={() => navigation.navigate('BlockedUsers')}
              />

              {/* Theme Toggle */}
              <ThemeToggle />
            </View>
          </View>
        </BlurView>

        {/* Danger Zone Card */}
        <BlurView
          intensity={20}
          tint="dark"
          style={[
            styles.card,
            {
              borderColor: colors.warningColor + '33', // ~20% opacity
            },
          ]}
        >
          <View style={styles.cardContent}>
            <ActionButton
              icon={Icons.TrashCan}
              title={t('delete-account')}
              description={t('permanently-delete-account')}
              onPress={confirmDeleteAccount}
              variant="warning"
              showChevron={false}
              loading={isDeletingAccount}
            />
          </View>
        </BlurView>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bio Edit Modal */}
      <BioEditModal
        visible={isBioModalOpen}
        currentBio={userData?.bio || ''}
        onClose={() => setIsBioModalOpen(false)}
        onSave={handleBioSave}
        isLoading={isUpdatingBio}
      />

      {/* Delete Account Confirm Modal */}
      <DeleteAccountConfirmModal
        visible={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccount}
        confirmationText="DELETE"
        loading={isDeletingAccount}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    // backgroundColor is set inline to use theme colors
  },
  signOutButton: {
    // backgroundColor is set inline to use theme colors
  },
  editButton: {
    // backgroundColor is set inline to use theme colors
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
  premiumBorder: {
    borderColor: '#FFC107',
    borderWidth: 3,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderWidth: 3,
  },
  avatarImage: {
    borderWidth: 3,
  },
  avatarFallback: {
    backgroundColor: 'transparent',
    // color is set inline to use theme colors
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  displayName: {
    // color is set inline to use theme colors
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
    // backgroundColor and borderColor are set inline to use theme colors
    borderRadius: 20,
    borderWidth: 1,
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
    // borderColor is set inline to use theme colors
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cardTitle: {
    // color is set inline to use theme colors
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
    // backgroundColor is set inline to use theme colors
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  infoItemValue: {
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
    // borderColor is set inline to use theme colors
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
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Bio Section
  bioSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  editBioButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    // backgroundColor and borderColor are set inline to use theme colors
    borderWidth: 1,
  },
  editBioText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bioContent: {
    marginLeft: 0,
  },
  bioText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontStyle: 'italic',
    opacity: 0.9,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 10,
  },
});
