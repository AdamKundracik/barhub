import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  separatorColor,
} from '../../utils/styles/colors';
import { userService } from '../../services/userService';
import { BlockedUserDTO } from '../../types/dto';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import { useCustomToast } from '../../components/shared/Toaster';
import { BlockUserModal } from '../../components/shared/Modals/BlockUserModal';
import { useUserStore } from '../../utils/store/userStore';
import { ScreenLayout } from '../../components/shared/Layouts/ScreenLayout';
import {
  addCacheBuster,
  createImageKey,
} from '../../utils/cache/imageCacheUtils';

interface BlockedUserItemProps {
  user: BlockedUserDTO;
  onUnblock: (userId: string, userName: string) => void;
}

const BlockedUserItem: React.FC<BlockedUserItemProps> = ({
  user,
  onUnblock,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const handleViewProfile = () => {
    const userId = user.id?.toString();
    if (userId) {
      navigation.navigate('UserDetail', { userId });
    }
  };

  const handleUnblock = () => {
    const userId = user.id?.toString();
    if (userId) {
      onUnblock(userId, user.name || 'Unknown User');
    }
  };

  return (
    <View style={styles.userItem}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={handleViewProfile}
        activeOpacity={0.7}
      >
        <Avatar size="sm" style={styles.avatar}>
          {user.photoUrl ? (
            <AvatarImage
              key={createImageKey('blockedusers', user.id?.toString(), user.photoUrl)}
              source={{
                uri: addCacheBuster(user.photoUrl, user.id?.toString()),
              }}
            />
          ) : (
            <AvatarFallbackText>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallbackText>
          )}
        </Avatar>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name || 'Unknown User'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.unblockButton}
        onPress={handleUnblock}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesomeIcon
          icon={Icons.CheckCircle}
          size={16}
          color={primaryColor}
        />
        <Text style={styles.unblockButtonText}>{t('blockUser.unblock')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const BlockedUsers: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockModalVisible, setUnblockModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  const fetchBlockedUsers = async () => {
    try {
      const users = await userService.getBlockedUsers();
      setBlockedUsers(users);

      // Update the userStore with the blocked user IDs for consistency
      const { setBlockedUsers: setStoreBlockedUsers } = useUserStore.getState();
      const blockedUserIds = users
        .map(user => user.id?.toString())
        .filter(Boolean) as string[];
      setStoreBlockedUsers(blockedUserIds);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      showErrorToast(
        t('error') || 'Error',
        t('error-fetching-blocked-users') || 'Failed to load blocked users'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data ONLY ONCE when component mounts
  useEffect(() => {
    fetchBlockedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - runs only once on mount

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlockedUsers();
  };

  const handleUnblockPress = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setUnblockModalVisible(true);
  };

  const handleUnblockConfirm = async () => {
    if (!selectedUser) return;

    try {
      setUnblocking(true);
      const success = await userService.unblockUser(selectedUser.id);

      if (success) {
        // Invalidate cache and refresh data from server
        await fetchBlockedUsers();

        showSuccessToast(
          t('blockUser.unblockSuccessTitle') || 'User Unblocked',
          t('blockUser.unblockSuccessMessage') ||
            'User has been unblocked successfully'
        );
      } else {
        throw new Error('Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      showErrorToast(
        t('error') || 'Error',
        t('error-unblocking-user') || 'Failed to unblock user'
      );
    } finally {
      setUnblocking(false);
      setUnblockModalVisible(false);
      setSelectedUser(null);
    }
  };

  const handleModalClose = () => {
    if (!unblocking) {
      setUnblockModalVisible(false);
      setSelectedUser(null);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <FontAwesomeIcon
          icon={Icons.CheckCircle}
          size={64}
          color={separatorColor}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {t('blockedUsers.emptyTitle') || 'No Blocked Users'}
      </Text>
      <Text style={styles.emptyMessage}>
        {t('blockedUsers.emptyMessage') || "You haven't blocked any users yet."}
      </Text>
    </View>
  );

  const renderUserItem = ({ item }: { item: BlockedUserDTO }) => (
    <BlockedUserItem user={item} onUnblock={handleUnblockPress} />
  );

  const keyExtractor = (item: BlockedUserDTO) => {
    return item.id?.toString() || `user-${Math.random()}`;
  };

  if (loading) {
    return (
      <ScreenLayout
        title={t('blockedUsers.title') || 'Blocked Users'}
        showTitle={true}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={t('blockedUsers.title') || 'Blocked Users'}
      showTitle={true}
      showBackButton={true}
      onBackPress={() => navigation.goBack()}
    >
      <FlatList
        data={blockedUsers}
        renderItem={renderUserItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContainer,
          blockedUsers.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <BlockUserModal
        visible={unblockModalVisible}
        onClose={handleModalClose}
        onConfirm={handleUnblockConfirm}
        userName={selectedUser?.name}
        isBlocked={true}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: secondaryTextColor,
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: primaryTextColor,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: secondaryTextColor,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 217, 185, 0.2)',
    minHeight: 40, // Smaller but still touchable
    minWidth: 85,
  },
  unblockButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: primaryColor,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryTextColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    lineHeight: 24,
  },
});
