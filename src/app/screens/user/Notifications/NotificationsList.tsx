import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import NotificationItemComponent from '../../../components/user/NewsFeed/Notifications/NotificationItemComponent';
import NotificationLoaderView from '../../../components/user/NewsFeed/Post/Loaders/NotificationLoaderView';
import InlineAd from '@/src/app/components/user/InlineAd';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useNotificationsStore } from '../../../utils/store/notificationsStore';
import { useNotificationsQuery } from '@/src/app/utils/hooks/useNotifications';
import { UserStackList } from '../../../utils/types/screen-types';
import { NotificationItem } from '../../../utils/types/notification-types';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  postBgColor,
  primaryColor,
  separatorColor,
  successColor,
} from '@/src/app/utils/styles/colors';

const NotificationsList: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const { isPremium } = useUserStore();
  const { data: storeData, markAllAsSeen } = useNotificationsStore();

  const { isLoading, refetch, isFetching } = useNotificationsQuery();
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [showAllRead, setShowAllRead] = useState(false);

  // Don't auto-refetch on mount - badge should stay until user clicks "mark all as read"

  // Memoized notifications count for performance
  const notificationStats = useMemo(() => {
    if (!storeData?.notifications) return { total: 0, unread: 0 };

    const total = storeData.notifications.length;
    const unread = storeData.notifications.filter(n => !n.read).length;

    return { total, unread };
  }, [storeData?.notifications]);

  // Swipe handlers with better state management
  const handleSwipeStart = useCallback(() => setIsScrollEnabled(false), []);
  const handleSwipeEnd = useCallback(() => setIsScrollEnabled(true), []);

  // Mark all as read with animation
  const handleMarkAllAsRead = useCallback(async () => {
    setShowAllRead(true);

    // Call backend to mark all as read
    await markAllAsSeen();

    // Refetch to update badge
    await refetch();

    setTimeout(() => {
      setShowAllRead(false);
    }, 2000);
  }, [markAllAsSeen, refetch]);

  // Enhanced render function with animation
  const renderItem = useCallback(
    ({ item, index }: { item: NotificationItem; index: number }) => (
      <Animated.View
        entering={FadeInUp.delay(index * 50).springify()}
        key={item.id}
      >
        <NotificationItemComponent
          item={item}
          onSwipeStart={handleSwipeStart}
          onSwipeEnd={handleSwipeEnd}
        />
      </Animated.View>
    ),
    [handleSwipeStart, handleSwipeEnd]
  );

  // Enhanced loading state with better UX
  if (isLoading || !storeData) {
    return (
      <ScreenLayout
        title={t('notifications')}
        showTitle
        showBackButton
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.loadingContainer}>
          <NotificationLoaderView />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={t('notifications')}
      showTitle
      showBackButton
      onBackPress={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Enhanced Header with Statistics */}
        <Animated.View
          entering={FadeInUp.springify()}
          style={styles.headerCard}
        >
          <View style={styles.headerContent}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{notificationStats.total}</Text>
                <Text style={styles.statLabel}>{t('total')}</Text>
              </View>

              {notificationStats.unread > 0 && (
                <View style={styles.statDivider} />
              )}

              {notificationStats.unread > 0 && (
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.unreadNumber]}>
                    {notificationStats.unread}
                  </Text>
                  <Text style={styles.statLabel}>{t('unread')}</Text>
                </View>
              )}
            </View>

            {/* Mark All as Read Button */}
            {notificationStats.unread > 0 && (
              <Pressable
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
              >
                {({ pressed }) => (
                  <>
                    <FontAwesomeIcon
                      icon={Icons.Check}
                      size={16}
                      color={pressed ? primaryColor : 'white'}
                    />
                    <Text
                      style={[
                        styles.markAllText,
                        pressed && styles.markAllTextPressed,
                      ]}
                    >
                      {t('mark-all-read')}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>

          {/* All Read Success Indicator */}
          {showAllRead && (
            <Animated.View
              entering={ZoomIn.springify()}
              style={styles.allReadIndicator}
            >
              <FontAwesomeIcon icon={Icons.Check} size={16} color="white" />
              <Text style={styles.allReadText}>{t('all-marked-read')}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Enhanced List with Better Performance */}
        <View style={styles.listWrapper}>
          <FlashList
            data={storeData.notifications}
            scrollEnabled={isScrollEnabled}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                progressViewOffset={20}
                enabled={isScrollEnabled}
                tintColor={primaryColor}
                colors={[primaryColor]}
                progressBackgroundColor={postBgColor}
              />
            }
            ListEmptyComponent={
              <Animated.View
                entering={FadeInUp.delay(200).springify()}
                style={styles.emptyContainer}
              >
                <View style={styles.emptyIconContainer}>
                  <FontAwesomeIcon
                    icon={Icons.Bell}
                    size={48}
                    color={separatorColor}
                  />
                </View>
                <Text style={styles.emptyTitle}>{t('no-notifications')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('notifications-will-appear-here')}
                </Text>
              </Animated.View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            removeClippedSubviews
          />
        </View>

        {/* Enhanced Ad Container */}
        {(PremiumHelpers.shouldAlwaysShowAds() || !isPremium()) && (
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={styles.adContainer}
          >
            <BlurView intensity={20} tint="dark" style={styles.adBlur}>
              <InlineAd />
            </BlurView>
          </Animated.View>
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    paddingTop: 20,
  },

  // Enhanced Header Card
  headerCard: {
    backgroundColor: postBgColor,
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },

  unreadNumber: {
    color: primaryColor,
  },

  statLabel: {
    color: separatorColor,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: separatorColor,
    marginHorizontal: 20,
    opacity: 0.3,
  },

  // Mark All Button
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  markAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  markAllTextPressed: {
    color: primaryColor,
  },

  // All Read Indicator
  allReadIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -12 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: successColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 8,
    shadowColor: successColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  allReadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Enhanced List
  listWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    overflow: 'hidden',
  },

  listContainer: {
    paddingVertical: 8,
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 16,
  },

  // Enhanced Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },

  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  emptyTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtitle: {
    color: separatorColor,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Enhanced Ad Container
  adContainer: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  adBlur: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default NotificationsList;
