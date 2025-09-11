import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { ScreenLayout } from '../../../components/user/Shared/ScreenLayout';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import NotificationItemComponent from '../../../components/user/NewsFeed/Notifications/NotificationItemComponent';
import { NotificationItem } from '../../../utils/types/notification-types';
import { UndoMessage } from '../../../components/user/NewsFeed/Notifications/UndoMessage';
import NotificationLoaderView from '../../../components/user/NewsFeed/Post/Loaders/NotificationLoaderView';
import { useNotificationsStore } from '../../../utils/store/notificationsStore';

export const NotificationsList: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const { data, refetch, isRefetching, isLoading, markAllAsSeen } =
    useNotificationsStore();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [lastDeletedItem, setLastDeletedItem] =
    useState<NotificationItem | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [isRefreshingManually, setIsRefreshingManually] = useState(false);

  useEffect(() => {
    if (data?.notifications) {
      setNotifications(data.notifications);
    }
  }, [data]);

  useEffect(() => {
    markAllAsSeen();
    refetch();
  }, []);

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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('no-notifications')}</Text>
            </View>
          }
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 700,
  },
});

export default NotificationsList;
