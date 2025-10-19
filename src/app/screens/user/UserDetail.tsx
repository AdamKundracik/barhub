import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useCustomToast } from '../../components/shared/Toaster';
import { useUserStore } from '../../utils/store/userStore';
import { useUserHighlights } from '../../hooks/useUserHighlights';
import { HighlightedPostsGrid } from '../../components/user/Profile/HighlightedPostsGrid';
import { FavoritePlaceDTO, ReasonTypeEnum } from '../../types/dto';
import { usePlaceStore } from '../../utils/store/placesStore';
import { UserReportModal } from '../../components/shared/Modals/UserReportModal';
import { reportService } from '../../services/reportService';
import { ReportReason } from '../../utils/types/Feed/PostTypes';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  primaryDeepColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '../../utils/styles/colors';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
// Removed date-fns import - using native JavaScript date functions

export const UserDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showErrorToast } = useCustomToast();
  const { getUserId } = useUserStore();
  const { setPlaceId, setPlaceName, setPlaceAddress } = usePlaceStore();

  const { userId } = route.params as { userId: string };
  const currentUserId = getUserId();
  const isOwnProfile = currentUserId === userId;

  const {
    data: userProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useUserProfile(userId);

  const { highlights, isLoading: isLoadingHighlights } =
    useUserHighlights(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleReportUser = useCallback(
    async (reason: ReportReason, customReason?: string) => {
      if (!userProfile?.id || !currentUserId) {
        showErrorToast('Error', 'Unable to report user');
        return;
      }

      try {
        const backendReason = reason as unknown as ReasonTypeEnum;
        await reportService.reportUser(
          userProfile.id,
          backendReason,
          customReason
        );

        showErrorToast(
          t('reportUser.successTitle') || 'Report Submitted',
          t('reportUser.successDescription') || 'Thank you for your report'
        );
      } catch (error: any) {
        console.error('Failed to report user:', error);
        showErrorToast(
          t('error') || 'Error',
          error.message || t('something-went-wrong') || 'Something went wrong'
        );
      } finally {
        setIsReportModalOpen(false);
      }
    },
    [userProfile?.id, currentUserId, showErrorToast, t]
  );

  // Funkcia pre správne slovenské množné čísla
  const getSlovakPlural = (
    count: number,
    singular: string,
    plural2to4: string,
    plural5plus: string
  ) => {
    if (count === 1) {
      return singular;
    } else if (count >= 2 && count <= 4) {
      return plural2to4;
    } else {
      return plural5plus;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return t('user.just-now') || 'práve teraz';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        const minutesText = getSlovakPlural(
          minutes,
          'minúta',
          'minúty',
          'minút'
        );
        return `${minutes} ${minutesText} ${t('user.ago') || 'dozadu'}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        const hoursText = getSlovakPlural(hours, 'hodina', 'hodiny', 'hodín');
        return `${hours} ${hoursText} ${t('user.ago') || 'dozadu'}`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        const daysText = getSlovakPlural(days, 'deň', 'dni', 'dní');
        return `${days} ${daysText} ${t('user.ago') || 'dozadu'}`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        const monthsText = getSlovakPlural(
          months,
          'mesiac',
          'mesiace',
          'mesiacov'
        );
        return `${months} ${monthsText} ${t('user.ago') || 'dozadu'}`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        const yearsText = getSlovakPlural(years, 'rok', 'roky', 'rokov');
        return `${years} ${yearsText} ${t('user.ago') || 'dozadu'}`;
      }
    } catch (error) {
      return dateString;
    }
  };

  const getAge = (dateOfBirth: string) => {
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    } catch (error) {
      return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <FontAwesomeIcon
              icon={Icons.ChevronLeft}
              size={20}
              color={primaryTextColor}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('user.profile') || 'Profile'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <Center style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
        </Center>
      </View>
    );
  }

  if (isError || !userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <FontAwesomeIcon
              icon={Icons.ChevronLeft}
              size={20}
              color={primaryTextColor}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('user.profile') || 'Profile'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <Center style={styles.errorContainer}>
          <FontAwesomeIcon icon={Icons.Pin} size={48} color={warningColor} />
          <Text style={styles.errorTitle}>{t('error.title') || 'Error'}</Text>
          <Text style={styles.errorMessage}>
            {error?.message ||
              t('error.loading-profile') ||
              'Failed to load profile'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>{t('retry') || 'Retry'}</Text>
          </TouchableOpacity>
        </Center>
      </View>
    );
  }

  const age = getAge(userProfile.dateOfBirth);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <FontAwesomeIcon
            icon={Icons.ChevronLeft}
            size={20}
            color={primaryTextColor}
          />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        {!isOwnProfile && (
          <TouchableOpacity
            onPress={() => setIsReportModalOpen(true)}
            style={styles.reportButton}
          >
            <FontAwesomeIcon
              icon={Icons.Warning}
              size={20}
              color={warningColor}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[primaryColor, '#0EA5E9', primaryDeepColor]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              {/* Avatar with glow effect */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarGlow}>
                  <Avatar
                    size="2xl"
                    style={[
                      styles.heroAvatar,
                      userProfile.premium && styles.premiumBorder,
                    ]}
                  >
                    {userProfile.photoUrl ? (
                      <AvatarImage source={{ uri: userProfile.photoUrl }} />
                    ) : (
                      <AvatarFallbackText style={styles.avatarFallback}>
                        {userProfile.name || t('anonymous-user')}
                      </AvatarFallbackText>
                    )}
                  </Avatar>
                </View>
              </View>

              {/* User Info */}
              <Text style={styles.heroName}>{userProfile.name}</Text>

              {/* Quick Stats Row */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {userProfile.totalPosts}
                  </Text>
                  <Text style={styles.quickStatLabel}>
                    {getSlovakPlural(
                      userProfile.totalPosts,
                      'príspevok',
                      'príspevky',
                      'príspevkov'
                    )}
                  </Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {userProfile.totalLikes}
                  </Text>
                  <Text style={styles.quickStatLabel}>
                    {getSlovakPlural(
                      userProfile.totalLikes,
                      'lajk',
                      'lajky',
                      'lajkov'
                    )}
                  </Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {userProfile.leaderboardPoints}
                  </Text>
                  <Text style={styles.quickStatLabel}>
                    {getSlovakPlural(
                      userProfile.leaderboardPoints,
                      'bod',
                      'body',
                      'bodov'
                    )}
                  </Text>
                </View>
              </View>

              {/* Badges */}
              <View style={styles.badgesContainer}>
                {age && (
                  <View style={styles.modernBadge}>
                    <FontAwesomeIcon
                      icon={Icons.Calendar}
                      size={12}
                      color={primaryColor}
                    />
                    <Text style={styles.modernBadgeText}>
                      {age} {t('user.years-old') || 'rokov'}
                    </Text>
                  </View>
                )}
                {userProfile.role === 'ADMIN' && (
                  <View style={[styles.modernBadge, styles.adminModernBadge]}>
                    <FontAwesomeIcon
                      icon={Icons.ShieldHalved}
                      size={12}
                      color="#FF6B6B"
                    />
                    <Text
                      style={[styles.modernBadgeText, { color: '#FF6B6B' }]}
                    >
                      Admin
                    </Text>
                  </View>
                )}
                {userProfile.role === 'MODERATOR' && (
                  <View
                    style={[styles.modernBadge, styles.moderatorModernBadge]}
                  >
                    <FontAwesomeIcon
                      icon={Icons.ShieldHalved}
                      size={12}
                      color="#3B82F6"
                    />
                    <Text
                      style={[styles.modernBadgeText, { color: '#3B82F6' }]}
                    >
                      Moderator
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Bio Section */}
        {userProfile.bio && (
          <View style={styles.bioSection}>
            <View style={styles.bioHeader}>
              <FontAwesomeIcon
                icon={Icons.Info}
                size={20}
                color={primaryColor}
              />
              <Text style={styles.bioSectionTitle}>
                {t('bio.label') || 'Bio'}
              </Text>
            </View>
            <View style={styles.bioContent}>
              <Text style={styles.bioText}>{userProfile.bio}</Text>
            </View>
          </View>
        )}

        {/* Highlighted Posts Grid */}
        <View style={styles.highlightsSection}>
          <HighlightedPostsGrid
            highlights={highlights}
            isLoading={isLoadingHighlights}
          />
        </View>

        {/* Favorite Places */}
        {userProfile.favoritePlaces &&
          userProfile.favoritePlaces.length > 0 && (
            <View style={styles.favoritePlacesSection}>
              <View style={styles.sectionHeader}>
                <FontAwesomeIcon
                  icon={Icons.HeartSolid}
                  size={20}
                  color="#FF6B6B"
                />
                <Text style={styles.sectionTitle}>
                  {t('user.favorite-places') || 'Obľúbené miesta'}
                </Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {userProfile.favoritePlaces.length}
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.favoritePlacesScroll}
                contentContainerStyle={styles.favoritePlacesContent}
              >
                {userProfile.favoritePlaces.map((place: FavoritePlaceDTO) => (
                  <TouchableOpacity
                    key={place.placeId}
                    style={styles.favoritePlaceCard}
                    onPress={() => {
                      // Set place data and navigate back to feed
                      setPlaceId(place.placeId);
                      setPlaceName(place.placeName);
                      setPlaceAddress(place.placeAddress);
                      navigation.goBack();
                    }}
                  >
                    <View style={styles.favoritePlaceIcon}>
                      <FontAwesomeIcon
                        icon={Icons.MapMarkerAlt}
                        size={16}
                        color="#FF6B6B"
                      />
                    </View>
                    <Text style={styles.favoritePlaceName} numberOfLines={1}>
                      {place.placeName}
                    </Text>
                    <Text style={styles.favoritePlaceAddress} numberOfLines={2}>
                      {place.placeAddress}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        {/* Detailed Stats */}
        <View style={styles.detailedStatsContainer}>
          <Text style={styles.sectionTitle}>
            {t('user.detailed-stats') || 'Detailed Statistics'}
          </Text>

          <View style={styles.modernStatsGrid}>
            <View style={styles.modernStatCard}>
              <View style={styles.modernStatHeader}>
                <View
                  style={[
                    styles.modernStatIcon,
                    { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={Icons.Image}
                    size={20}
                    color="#4CAF50"
                  />
                </View>
                <Text style={styles.modernStatTitle}>
                  {getSlovakPlural(
                    userProfile.totalHighlights,
                    'zvýraznenie',
                    'zvýraznenia',
                    'zvýraznení'
                  )}
                </Text>
              </View>
              <Text style={styles.modernStatNumber}>
                {userProfile.totalHighlights}
              </Text>
              <Text style={styles.modernStatDescription}>
                {getSlovakPlural(
                  userProfile.totalHighlights,
                  'zvýraznený príspevok',
                  'zvýraznené príspevky',
                  'zvýraznených príspevkov'
                )}
              </Text>
            </View>

            <View style={styles.modernStatCard}>
              <View style={styles.modernStatHeader}>
                <View
                  style={[
                    styles.modernStatIcon,
                    { backgroundColor: 'rgba(156, 39, 176, 0.15)' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={Icons.MapMarkerAlt}
                    size={20}
                    color="#9C27B0"
                  />
                </View>
                <Text style={styles.modernStatTitle}>
                  {t('user.favorite-places') || 'Places'}
                </Text>
              </View>
              <Text style={styles.modernStatNumber}>
                {userProfile.favoritePlacesCount}
              </Text>
              <Text style={styles.modernStatDescription}>
                {t('user.favorite-places-desc') || 'Saved locations'}
              </Text>
            </View>
          </View>

          <View style={styles.modernStatsGrid}>
            <View style={styles.modernStatCard}>
              <View style={styles.modernStatHeader}>
                <View
                  style={[
                    styles.modernStatIcon,
                    { backgroundColor: 'rgba(33, 150, 243, 0.15)' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={Icons.Clock}
                    size={20}
                    color="#2196F3"
                  />
                </View>
                <Text style={styles.modernStatTitle}>
                  {t('user.activity') || 'Activity'}
                </Text>
              </View>
              <Text style={styles.modernStatNumber}>
                {userProfile.lastUploadedPostAt
                  ? formatDate(userProfile.lastUploadedPostAt)
                  : t('user.never') || 'Never'}
              </Text>
              <Text style={styles.modernStatDescription}>
                {t('user.last-post-desc') || 'Last contribution'}
              </Text>
            </View>

            <View style={styles.modernStatCard}>
              <View style={styles.modernStatHeader}>
                <View
                  style={[
                    styles.modernStatIcon,
                    { backgroundColor: `rgba(16, 217, 185, 0.15)` },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={Icons.TrendingUp}
                    size={20}
                    color={primaryColor}
                  />
                </View>
                <Text style={styles.modernStatTitle}>
                  {t('user.engagement') || 'Engagement'}
                </Text>
              </View>
              <Text style={styles.modernStatNumber}>
                {userProfile.totalPosts > 0
                  ? Math.round(userProfile.totalLikes / userProfile.totalPosts)
                  : 0}
              </Text>
              <Text style={styles.modernStatDescription}>
                {(() => {
                  const avgLikes =
                    userProfile.totalPosts > 0
                      ? Math.round(
                          userProfile.totalLikes / userProfile.totalPosts
                        )
                      : 0;
                  return `Priemerné ${getSlovakPlural(avgLikes, 'lajk', 'lajky', 'lajkov')} na príspevok`;
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Settings (only for own profile) */}
        {isOwnProfile && (
          <View style={styles.privacySection}>
            <Text style={styles.sectionTitle}>
              {t('user.privacy-settings') || 'Privacy & Security'}
            </Text>

            <View style={styles.modernPrivacyGrid}>
              <View style={styles.modernPrivacyCard}>
                <View
                  style={[
                    styles.privacyIconContainer,
                    {
                      backgroundColor: userProfile.emailVerified
                        ? 'rgba(76, 175, 80, 0.15)'
                        : 'rgba(254, 120, 120, 0.15)',
                    },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={
                      userProfile.emailVerified
                        ? Icons.CheckCircle
                        : Icons.Warning
                    }
                    size={24}
                    color={userProfile.emailVerified ? '#4CAF50' : warningColor}
                  />
                </View>
                <Text style={styles.privacyCardTitle}>
                  {t('user.email-status') || 'Email Status'}
                </Text>
                <Text style={styles.privacyCardValue}>
                  {userProfile.emailVerified
                    ? t('user.verified') || 'Verified'
                    : t('user.not-verified') || 'Not Verified'}
                </Text>
                <Text style={styles.privacyCardDescription}>
                  {userProfile.emailVerified
                    ? t('user.email-verified-desc') || 'Your email is secure'
                    : t('user.email-not-verified-desc') ||
                      'Please verify your email'}
                </Text>
              </View>

              <View style={styles.modernPrivacyCard}>
                <View
                  style={[
                    styles.privacyIconContainer,
                    {
                      backgroundColor: userProfile.usingFakeLocation
                        ? 'rgba(254, 120, 120, 0.15)'
                        : 'rgba(76, 175, 80, 0.15)',
                    },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={
                      userProfile.usingFakeLocation
                        ? Icons.EyeSlash
                        : Icons.MapMarkerAlt
                    }
                    size={24}
                    color={
                      userProfile.usingFakeLocation ? warningColor : '#4CAF50'
                    }
                  />
                </View>
                <Text style={styles.privacyCardTitle}>
                  {t('user.location-status') || 'Location'}
                </Text>
                <Text style={styles.privacyCardValue}>
                  {userProfile.usingFakeLocation
                    ? t('user.fake') || 'Private'
                    : t('user.real') || 'Real'}
                </Text>
                <Text style={styles.privacyCardDescription}>
                  {userProfile.usingFakeLocation
                    ? t('user.using-fake-location-desc') ||
                      'Privacy mode active'
                    : t('user.using-real-location-desc') ||
                      'Sharing real location'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Report Modal */}
      {!isOwnProfile && (
        <UserReportModal
          visible={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSave={handleReportUser}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: primaryTextColor,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 50,
  },
  loadingText: {
    color: secondaryTextColor,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: primaryTextColor,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Hero Section Styles
  heroSection: {
    marginTop: -100,
    paddingTop: 100,
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarGlow: {
    padding: 4,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroAvatar: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarFallback: {
    backgroundColor: 'transparent',
    color: primaryTextColor,
  },
  premiumBorder: {
    borderColor: '#FFC107',
    borderWidth: 3,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    lineHeight: 32,
  },
  bioSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  bioSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: primaryTextColor,
  },
  bioContent: {
    backgroundColor: postBgColor,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 124, 124, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bioText: {
    fontSize: 16,
    color: primaryTextColor,
    lineHeight: 24,
    textAlign: 'left',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginHorizontal: 8,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  modernBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 80,
  },
  modernBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  adminModernBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  moderatorModernBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  // Modern Stats Styles
  detailedStatsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: primaryTextColor,
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  modernStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  modernStatCard: {
    flex: 1,
    backgroundColor: postBgColor,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 124, 124, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  modernStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernStatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: secondaryTextColor,
    flex: 1,
  },
  modernStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryTextColor,
    marginBottom: 8,
    lineHeight: 30,
    textAlign: 'center',
  },
  modernStatDescription: {
    fontSize: 12,
    color: secondaryTextColor,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  // Highlights Styles
  highlightsSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  // Favorite Places Styles
  favoritePlacesSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  favoritePlacesScroll: {
    flexDirection: 'row',
  },
  favoritePlacesContent: {
    paddingRight: 20,
  },
  favoritePlaceCard: {
    width: 160,
    backgroundColor: postBgColor,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 124, 124, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoritePlaceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  favoritePlaceName: {
    fontSize: 14,
    fontWeight: '600',
    color: primaryTextColor,
    marginBottom: 4,
  },
  favoritePlaceAddress: {
    fontSize: 12,
    color: secondaryTextColor,
    lineHeight: 14,
  },
  // Privacy Styles
  privacySection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modernPrivacyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modernPrivacyCard: {
    flex: 1,
    backgroundColor: postBgColor,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(124, 124, 124, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  privacyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  privacyCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: secondaryTextColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  privacyCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  privacyCardDescription: {
    fontSize: 12,
    color: secondaryTextColor,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 50,
  },
});

export default UserDetail;
