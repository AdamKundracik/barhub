import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import NotificationItemComponent from '../../../components/user/NewsFeed/Notifications/NotificationItemComponent';
import NotificationLoaderView from '../../../components/user/NewsFeed/Post/Loaders/NotificationLoaderView';
import InlineAd from '@/src/app/components/user/InlineAd';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { NotificationItem } from '../../../utils/types/notification-types';
import { useNotificationsStore } from '../../../utils/store/notificationsStore';
import { useNotificationsQuery } from '@/src/app/utils/hooks/useNotifications';

export const NotificationsList: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const { premium } = useUserStore();
  const { data: storeData, markAllAsSeen } = useNotificationsStore();
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  markAllAsSeen();

  // --- Use custom hook ---
  const { isLoading, refetch, isFetching } = useNotificationsQuery();

  const handleRefresh = useCallback(() => {
    if (!isScrollEnabled) return;
    refetch();
  }, [isScrollEnabled, refetch]);

  const handleSwipeStart = useCallback(() => setIsScrollEnabled(false), []);
  const handleSwipeEnd = useCallback(() => setIsScrollEnabled(true), []);

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

  if (isLoading || !storeData) {
    return (
      <ScreenLayout
        title={t('notifications')}
        clickFunction={() => navigation.goBack()}
      >
        <NotificationLoaderView />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={t('notifications')}
      clickFunction={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <FlatList
          data={storeData.notifications}
          scrollEnabled={isScrollEnabled}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              progressViewOffset={20}
              enabled={isScrollEnabled}
            />
          }
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('no-notifications')}</Text>
            </View>
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </View>

      {!premium && (
        <View style={{ paddingVertical: 8 }}>
          <InlineAd />
        </View>
      )}
    </ScreenLayout>
  );
};

export const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  emptyText: { color: 'white', fontSize: 24, fontWeight: '700' },
});

export default NotificationsList;
