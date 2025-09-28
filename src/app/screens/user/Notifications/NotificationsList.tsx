import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import NotificationItemComponent from '../../../components/user/NewsFeed/Notifications/NotificationItemComponent';
import NotificationLoaderView from '../../../components/user/NewsFeed/Post/Loaders/NotificationLoaderView';
import InlineAd from '@/src/app/components/user/InlineAd';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useNotificationsStore } from '../../../utils/store/notificationsStore';
import { useNotificationsQuery } from '@/src/app/utils/hooks/useNotifications';
import { UserStackList } from '../../../utils/types/screen-types';
import { NotificationItem } from '../../../utils/types/notification-types';
import { FlashList } from '@shopify/flash-list';

const NotificationsList: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const { premium } = useUserStore();
  const { data: storeData, markAllAsSeen } = useNotificationsStore();

  const { isLoading, refetch, isFetching } = useNotificationsQuery();
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // Mark notifications as seen when they arrive
  useEffect(() => {
    if (storeData?.hasNewNotifications) {
      markAllAsSeen();
    }
  }, [storeData?.hasNewNotifications, markAllAsSeen]);

  // Swipe handlers
  const handleSwipeStart = useCallback(() => setIsScrollEnabled(false), []);
  const handleSwipeEnd = useCallback(() => setIsScrollEnabled(true), []);

  // Render individual notification
  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <NotificationItemComponent
        item={item}
        onSwipeStart={handleSwipeStart}
        onSwipeEnd={handleSwipeEnd}
      />
    ),
    [handleSwipeStart, handleSwipeEnd]
  );

  // Loading state
  if (isLoading || !storeData) {
    return (
      <ScreenLayout
        title={t('notifications')}
        showTitle
        showBackButton
        onBackPress={() => navigation.goBack()}
      >
        <NotificationLoaderView />
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
      <FlashList
        data={storeData.notifications}
        scrollEnabled={isScrollEnabled}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            progressViewOffset={20}
            enabled={isScrollEnabled}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('no-notifications')}</Text>
          </View>
        }
        removeClippedSubviews
      />

      {!premium && <InlineAdWrapper />}
    </ScreenLayout>
  );
};

// Separate wrapper for the inline ad for cleaner JSX
const InlineAdWrapper = () => <InlineAd />;

const styles = StyleSheet.create({
  listContainer: { paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  emptyText: { color: 'white', fontSize: 24, fontWeight: '700' },
});

export default NotificationsList;
