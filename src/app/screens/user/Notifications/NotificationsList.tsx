import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { getUserNotifications } from '../../../utils/services/notifications-service';
import { ScreenLayout } from '../../../components/user/Shared/ScreenLayout';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import LoadingIndicator from '../../../components/user/NewsFeed/LoadingIndicator';
import NotificationItemComponent from './NotificationItemComponent';
import {
  GetNotificationsResult,
  NotificationItem,
} from '../../../utils/types/notification-types';
import { UndoMessage } from './UndoMessage';
import NotificationLoaderView from '../../../components/user/NewsFeed/Post/Loaders/NotificationLoaderView';

export const NotificationsList: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [lastDeletedItem, setLastDeletedItem] =
    useState<NotificationItem | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [isRefreshingManually, setIsRefreshingManually] = useState(false);

  const {
    data: notificationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<GetNotificationsResult>(
    'notifications',
    () => getUserNotifications(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      enabled: true,
      staleTime: 1000 * 60,
      retry: 2,
      retryDelay: 1000,
      refetchOnMount: !isScrollEnabled,
    }
  );

  useEffect(() => {
    if (notificationsData?.data?.notifications) {
      setNotifications(notificationsData.data.notifications);
    }
  }, [notificationsData]);

  const handleRefresh = async () => {
    if (!isScrollEnabled || isRefreshingManually) return;

    setIsRefreshingManually(true);
    try {
      await refetch();
    } finally {
      setIsRefreshingManually(false);
    }
  };

  const handleDelete = useCallback(
    (id: string) => {
      const deletedItem = notifications.find(n => n.id === id);
      if (deletedItem) {
        setLastDeletedItem(deletedItem);
        setShowUndo(true);
        setNotifications(current =>
          current.filter(notification => notification.id !== id)
        );
      }
    },
    [notifications]
  );

  const handleUndo = useCallback(() => {
    if (lastDeletedItem) {
      setNotifications(current =>
        [...current, lastDeletedItem].sort(
          (a, b) => b.creationTime.seconds - a.creationTime.seconds
        )
      );
      setLastDeletedItem(null);
    }
  }, [lastDeletedItem]);

  const handleUndoHide = useCallback(() => {
    setShowUndo(false);
    setLastDeletedItem(null);
  }, []);

  const handleSwipeStart = useCallback(() => {
    setIsScrollEnabled(false);
  }, []);

  const handleSwipeEnd = useCallback(() => {
    setIsScrollEnabled(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <NotificationItemComponent
        item={item}
        onDelete={() => handleDelete(item.id)}
        onSwipeStart={handleSwipeStart}
        onSwipeEnd={handleSwipeEnd}
      />
    ),
    [handleDelete, handleSwipeStart, handleSwipeEnd]
  );

  if (isLoading) {
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
          data={notifications}
          scrollEnabled={isScrollEnabled}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingManually}
              onRefresh={handleRefresh}
              progressViewOffset={20}
              enabled={isScrollEnabled}
            />
          }
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={isRefetching ? <LoadingIndicator /> : null}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
        {showUndo && (
          <UndoMessage onUndo={handleUndo} onHide={handleUndoHide} />
        )}
      </View>
    </ScreenLayout>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 100,
  },
});

export default NotificationsList;
