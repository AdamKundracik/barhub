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
import { useNavigationStore } from '../../utils/store/navigationStore';
import { UserReportModal } from '../../components/shared/Modals/UserReportModal';
import { BlockUserModal } from '../../components/shared/Modals/BlockUserModal';
import { reportService } from '../../services/reportService';
import { addCacheBuster, createImageKey } from '../../utils/cache/imageCacheUtils';
import { ReportReason } from '../../utils/types/Feed/PostTypes';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  primaryDeepColor,
  primaryLightGrey,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '../../utils/styles/colors';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';
import InlineAd from '../../components/user/InlineAd';
import Animated, { FadeInUp } from 'react-native-reanimated';
// Removed date-fns import - using native JavaScript date functions

export const UserDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { showErrorToast } = useCustomToast();
  const { getUserId, blockUser, unblockUser, isUserBlocked, isPremium } =
    useUserStore();
  const { setPlaceId, setPlaceName, setPlaceAddress } = usePlaceStore();
  const { previousPage } = useNavigationStore();

  const { userId } = route.params as { userId: string };
  const currentUserId = getUserId();
  const isOwnProfile = currentUserId === userId;
  const userIsBlocked = isUserBlocked(userId);

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
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

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

        // Nezobraziť toast tu, UserReportModal si to rieši sám
        // showErrorToast(
        //   t('reportUser.successTitle') || 'Report Submitted',
        //   t('reportUser.successDescription') || 'Thank you for your report'
        // );
      } catch (error: any) {
        console.error('Failed to report user:', error);

        // Handle specific error codes
        let errorTitle = t('error') || 'Error';
        let errorMessage =
          error.message || t('something-went-wrong') || 'Something went wrong';

        if (
          error.errorCode === 'USER_ALREADY_REPORTED' ||
          (error.message &&
            error.message.includes('You have already reported this user'))
        ) {
          errorTitle =
            t('reportUser.alreadyReportedTitle') || 'Already Reported';
          // Use localized message instead of backend message
          errorMessage =
            t('reportUser.alreadyReportedMessage') ||
            'You have already reported this user. Multiple reports from the same user are not allowed.';
        }

        showErrorToast(errorTitle, errorMessage);
        // Zatvor modal len pri chybe
        setIsReportModalOpen(false);
        throw error; // Re-throw error aby UserReportModal vedel o chybe
      }
      // Neuzatváraj modal automaticky - UserReportModal si to rieši sám
    },
    [userProfile?.id, currentUserId, showErrorToast, t]
  );

  const handleBlockUser = useCallback(async () => {
    if (!userId) {
      showErrorToast('Error', 'Unable to block user');
      return;
    }

    try {
      if (userIsBlocked) {
        await unblockUser(userId);
        showErrorToast(
          t('blockUser.unblockSuccessTitle') || 'User Unblocked',
          t('blockUser.unblockSuccessMessage') ||
            'User has been unblocked successfully'
        );
      } else {
        await blockUser(userId);
        showErrorToast(
          t('blockUser.blockSuccessTitle') || 'User Blocked',
          t('blockUser.blockSuccessMessage') ||
            'User has been blocked successfully'
        );
      }
    } catch (error: any) {
      console.error('Failed to block/unblock user:', error);
      showErrorToast(
        t('error') || 'Error',
        error.message || t('something-went-wrong') || 'Something went wrong'
      );
    } finally {
      setIsBlockModalOpen(false);
    }
  }, [userId, userIsBlocked, blockUser, unblockUser, showErrorToast, t]);

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

  // Funkcia pre získanie správneho tvaru slova podľa jazyka
  const getTimeText = (
    count: number,
    timeUnit: 'minute' | 'hour' | 'day' | 'month' | 'year'
  ) => {
    if (i18n.language === 'sk') {
      // Pre slovenčinu používame komplexnú logiku z JSON
      return getSlovakPlural(
        count,
        t(`user.${timeUnit}`) || '',
        t(`user.${timeUnit}s`) || '',
        t(`user.${timeUnit}s_plural`) || ''
      );
    } else {
      // Pre ostatné jazyky používame hardcoded anglické texty (pretože JSON preklady neexistujú)
      const englishTexts = {
        minute: count === 1 ? 'minute' : 'minutes',
        hour: count === 1 ? 'hour' : 'hours',
        day: count === 1 ? 'day' : 'days',
        month: count === 1 ? 'month' : 'months',
        year: count === 1 ? 'year' : 'years',
      };
      return englishTexts[timeUnit];
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Parse LocalDateTime string: "2025-10-07T22:29:23.517475"
      // Backend sends UTC time but without 'Z' suffix, so we need to treat it as UTC
      let dateStr = dateString.includes('T')
        ? dateString
        : dateString.replace(' ', 'T');

      // Add 'Z' suffix to indicate UTC time
      if (
        !dateStr.endsWith('Z') &&
        !dateStr.includes('+') &&
        !dateStr.includes('-', 10)
      ) {
        dateStr += 'Z';
      }

      const date = new Date(dateStr);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      // Get "ago" text based on language
      const getAgoText = () => {
        if (i18n.language === 'sk') {
          return t('user.ago') || 'dozadu';
        } else if (i18n.language === 'es') {
          return 'hace';
        } else {
          return 'ago'; // English and other languages
        }
      };

      const agoText = getAgoText();

      if (diffInSeconds < 60) {
        if (i18n.language === 'sk') {
          return t('user.just-now') || 'práve teraz';
        } else {
          return 'just now';
        }
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        const minutesText = getTimeText(minutes, 'minute');
        // Special handling for Spanish - "hace X min" instead of "X min hace"
        if (i18n.language === 'es') {
          return `${agoText} ${minutes} ${minutesText}`;
        }
        return `${minutes} ${minutesText} ${agoText}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        const hoursText = getTimeText(hours, 'hour');
        // Special handling for Spanish - "hace X horas" instead of "X horas hace"
        if (i18n.language === 'es') {
          return `${agoText} ${hours} ${hoursText}`;
        }
        return `${hours} ${hoursText} ${agoText}`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        const daysText = getTimeText(days, 'day');
        // Special handling for Spanish - "hace X días" instead of "X días hace"
        if (i18n.language === 'es') {
          return `${agoText} ${days} ${daysText}`;
        }
        return `${days} ${daysText} ${agoText}`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        const monthsText = getTimeText(months, 'month');
        // Special handling for Spanish - "hace X meses" instead of "X meses hace"
        if (i18n.language === 'es') {
          return `${agoText} ${months} ${monthsText}`;
        }
        return `${months} ${monthsText} ${agoText}`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        const yearsText = getTimeText(years, 'year');
        // Special handling for Spanish - "hace X años" instead of "X años hace"
        if (i18n.language === 'es') {
          return `${agoText} ${years} ${yearsText}`;
        }
        return `${years} ${yearsText} ${agoText}`;
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
        <View style={styles.headerActions}>
          {!isOwnProfile && (
            <>
              <TouchableOpacity
                onPress={() => setIsBlockModalOpen(true)}
                style={[
                  styles.actionButton,
                  userIsBlocked && styles.unblockButton,
                ]}
              >
                <FontAwesomeIcon
                  icon={userIsBlocked ? Icons.CheckCircle : Icons.Ban}
                  size={18}
                  color={userIsBlocked ? primaryLightGrey : warningColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsReportModalOpen(true)}
                style={styles.actionButton}
              >
                <FontAwesomeIcon
                  icon={Icons.Warning}
                  size={18}
                  color={warningColor}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
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
                      // Show premium border only if premium UI is enabled and user is premium
                      PremiumHelpers.shouldShowPremiumBorders() &&
                        userProfile.premium &&
                        styles.premiumBorder,
                    ]}
                  >
                    {userProfile.photoUrl ? (
                      <AvatarImage 
                        key={createImageKey('userdetail', userProfile.id, userProfile.photoUrl)}
                        source={{ 
                          uri: addCacheBuster(userProfile.photoUrl, userProfile.id)
                        }} 
                      />
                    ) : (
                      <AvatarFallbackText className={'text-white'}>
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
                    {t('user.posts') || 'Príspevky'}
                  </Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {userProfile.totalLikes}
                  </Text>
                  <Text style={styles.quickStatLabel}>
                    {t('user.likes') || 'Páči sa mi'}
                  </Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {userProfile.leaderboardPoints}
                  </Text>
                  <Text style={styles.quickStatLabel}>
                    {t('user.points') || 'Body'}
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
        <View style={styles.bioSection}>
          <View style={styles.bioHeader}>
            <FontAwesomeIcon icon={Icons.Info} size={20} color={primaryColor} />
            <Text style={styles.bioSectionTitle}>
              {t('bio.label') || 'Bio'}
            </Text>
          </View>
          <View style={styles.bioContent}>
            <Text style={styles.bioText}>
              {userProfile.bio || t('bio.no-bio') || 'No bio yet'}
            </Text>
          </View>
        </View>

        {/* Highlighted Posts Grid */}
        <View style={styles.highlightsSection}>
          <HighlightedPostsGrid
            highlights={highlights}
            isLoading={isLoadingHighlights}
          />
        </View>

        {/* Ad Section */}
        {(PremiumHelpers.shouldAlwaysShowAds() || !isPremium()) && (
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={styles.adContainer}
          >
            <InlineAd />
          </Animated.View>
        )}

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
                      // Set place data
                      setPlaceId(place.placeId);
                      setPlaceName(place.placeName);
                      setPlaceAddress(place.placeAddress);

                      // Check previous page and redirect to Feed with placeId filter if needed
                      if (previousPage && previousPage !== 'Feed') {
                        // If previous page was not Feed, redirect to Feed with placeId filter
                        (navigation as any).navigate('MainTabs', {
                          screen: 'Feed',
                          params: { placeId: place.placeId },
                        });
                      } else {
                        // If previous page was Feed, just go back
                        navigation.goBack();
                      }
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
                  {t('user.highlights') || 'Zvýraznenia'}
                </Text>
              </View>
              <Text style={styles.modernStatNumber}>
                {userProfile.totalHighlights}
              </Text>
              <Text style={styles.modernStatDescription}>
                {t('user.highlights-desc') || 'Zvýraznené príspevky'}
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
                  userProfile.totalPosts > 0
                    ? Math.round(
                        userProfile.totalLikes / userProfile.totalPosts
                      )
                    : 0;
                  return `${t('user.avg-likes') || 'Priemerné páči sa mi na príspevok'}`;
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
          onBlockUser={userIsBlocked ? undefined : handleBlockUser}
          userName={userProfile?.name}
        />
      )}

      {/* Block User Modal */}
      {!isOwnProfile && (
        <BlockUserModal
          visible={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          onConfirm={handleBlockUser}
          userName={userProfile?.name}
          isBlocked={userIsBlocked}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unblockButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
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
    lineHeight: 22,
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
  // Ad Styles
  adContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  adBlur: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 124, 124, 0.2)',
  },
});

export default UserDetail;
