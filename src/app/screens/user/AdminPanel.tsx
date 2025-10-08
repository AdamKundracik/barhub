import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useUserRole } from '../../hooks/useUserRole';
import { ClientDTO, RoleEnum } from '../../types/dto';
import {
  primaryBgColor,
  primaryColor,
  separatorColor,
  warningColor,
} from '../../utils/styles/colors';
import { ScreenLayout } from '../../components/shared/Layouts/ScreenLayout';
import { BlurView } from 'expo-blur';
import { userService } from '../../services/userService';
import { useCustomToast } from '../../components/shared/Toaster';
import FastImage from 'react-native-fast-image';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

interface UserItemProps {
  user: ClientDTO;
  onUserPress: (user: ClientDTO) => void;
  currentUserRole: RoleEnum | null;
}

const UserItem: React.FC<UserItemProps> = ({
  user,
  onUserPress,
  currentUserRole,
}) => {
  const getRoleBadgeColor = (role: RoleEnum) => {
    switch (role) {
      case RoleEnum.ADMIN:
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#EF4444',
        };
      case RoleEnum.MODERATOR:
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.3)',
          text: '#3B82F6',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          text: '#FFF',
        };
    }
  };

  const roleColors = getRoleBadgeColor(user.role);
  const canManage =
    currentUserRole === RoleEnum.ADMIN ||
    (currentUserRole === RoleEnum.MODERATOR && user.role === RoleEnum.USER);

  return (
    <TouchableOpacity
      style={[styles.userItem, !canManage && styles.userItemDisabled]}
      onPress={() => canManage && onUserPress(user)}
      disabled={!canManage}
      activeOpacity={0.7}
    >
      <View style={styles.userItemLeft}>
        <FastImage
          source={
            user.photoUrl
              ? { uri: user.photoUrl, priority: FastImage.priority.normal }
              : require('../../../../assets/userIcon.png')
          }
          style={styles.userAvatar}
        />

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            {user.premium && (
              <FontAwesomeIcon icon={Icons.Crown} size={14} color="#FFD700" />
            )}
            {user.disabled && (
              <View style={styles.disabledBadge}>
                <Text style={styles.disabledText}>DISABLED</Text>
              </View>
            )}
          </View>

          <Text style={styles.userEmail} numberOfLines={1}>
            {user.email}
          </Text>

          <View style={styles.userMetaRow}>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: roleColors.bg,
                  borderColor: roleColors.border,
                },
              ]}
            >
              <FontAwesomeIcon
                icon={
                  user.role === RoleEnum.ADMIN
                    ? Icons.RankingStar
                    : user.role === RoleEnum.MODERATOR
                      ? Icons.ShieldHalved
                      : Icons.User
                }
                size={10}
                color={roleColors.text}
              />
              <Text style={[styles.roleText, { color: roleColors.text }]}>
                {user.role}
              </Text>
            </View>

            <Text style={styles.userId}>ID: {user.id}</Text>
          </View>
        </View>
      </View>

      {canManage && (
        <FontAwesomeIcon
          icon={Icons.ChevronRight}
          size={16}
          color={separatorColor}
        />
      )}
    </TouchableOpacity>
  );
};

export const AdminPanel: React.FC = () => {
  const { isAdmin, isModerator, role } = useUserRole();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ClientDTO | null>(null);
  const listRef = useRef<any>(null);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    // Scroll to top when clearing search
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }, []);

  // Fetch all users
  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery<ClientDTO[]>(
    ['admin', 'users'],
    async () => {
      const response = await userService.getAllUsers();
      return response || [];
    },
    {
      enabled: isAdmin || isModerator,
      staleTime: 30000,
    }
  );

  // Update user role mutation
  const updateRoleMutation = useMutation(
    async ({ userId, newRole }: { userId: number; newRole: RoleEnum }) => {
      return await userService.updateUserRole(userId, newRole);
    },
    {
      onSuccess: () => {
        showSuccessToast(t('success'), t('admin.roleUpdated'));
        queryClient.invalidateQueries(['admin', 'users']);
        setSelectedUser(null);
      },
      onError: (error: any) => {
        showErrorToast(t('error'), error.message || 'Failed to update role');
      },
    }
  );

  // Disable user mutation
  const disableUserMutation = useMutation(
    async ({ userId, disabled }: { userId: number; disabled: boolean }) => {
      return await userService.updateUserDisabledStatus(userId, disabled);
    },
    {
      onSuccess: (_, variables) => {
        showSuccessToast(
          t('success'),
          variables.disabled ? t('admin.userDisabled') : t('admin.userEnabled')
        );
        queryClient.invalidateQueries(['admin', 'users']);
        setSelectedUser(null);
      },
      onError: (error: any) => {
        showErrorToast(
          t('error'),
          error.message || 'Failed to update user status'
        );
      },
    }
  );

  // Update premium mutation (Admin only)
  const updatePremiumMutation = useMutation(
    async ({ userId, premium }: { userId: number; premium: boolean }) => {
      return await userService.updateUserPremium(userId, premium);
    },
    {
      onSuccess: () => {
        showSuccessToast(t('success'), t('admin.premiumUpdated'));
        queryClient.invalidateQueries(['admin', 'users']);
        setSelectedUser(null);
      },
      onError: (error: any) => {
        showErrorToast(
          t('error'),
          error.message || 'Failed to update premium status'
        );
      },
    }
  );

  const handleUserPress = useCallback((user: ClientDTO) => {
    setSelectedUser(user);
  }, []);

  const handleChangeRole = useCallback(
    (newRole: RoleEnum) => {
      if (!selectedUser) return;

      Alert.alert(
        t('admin.changeRole'),
        t('admin.changeRoleConfirm', { name: selectedUser.name, role: newRole }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('confirm'),
            style: 'destructive',
            onPress: () => {
              updateRoleMutation.mutate({ userId: selectedUser.id, newRole });
            },
          },
        ]
      );
    },
    [selectedUser, updateRoleMutation]
  );

  const handleToggleDisabled = useCallback(() => {
    if (!selectedUser) return;

    Alert.alert(
      selectedUser.disabled ? t('admin.enableUser') : t('admin.disableUser'),
      selectedUser.disabled 
        ? t('admin.enableConfirm', { name: selectedUser.name })
        : t('admin.disableConfirm', { name: selectedUser.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: () => {
            disableUserMutation.mutate({
              userId: selectedUser.id,
              disabled: !selectedUser.disabled,
            });
          },
        },
      ]
    );
  }, [selectedUser, disableUserMutation, t]);

  const handleTogglePremium = useCallback(() => {
    if (!selectedUser || !isAdmin) return;

    Alert.alert(
      selectedUser.premium ? t('admin.revokePremium') : t('admin.grantPremium'),
      selectedUser.premium
        ? t('admin.revokePremiumConfirm', { name: selectedUser.name })
        : t('admin.grantPremiumConfirm', { name: selectedUser.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            updatePremiumMutation.mutate({
              userId: selectedUser.id,
              premium: !selectedUser.premium,
            });
          },
        },
      ]
    );
  }, [selectedUser, isAdmin, updatePremiumMutation, t]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return users; // Return all users if search is empty
    }

    const query = searchQuery.toLowerCase().trim();
    return users.filter(
      user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toString().includes(query)
    );
  }, [users, searchQuery]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter(u => u.role === RoleEnum.ADMIN).length,
      moderators: users.filter(u => u.role === RoleEnum.MODERATOR).length,
      users: users.filter(u => u.role === RoleEnum.USER).length,
      premium: users.filter(u => u.premium).length,
      disabled: users.filter(u => u.disabled).length,
    }),
    [users]
  );

  if (!isAdmin && !isModerator) {
    return (
      <ScreenLayout>
        <View style={styles.unauthorizedContainer}>
          <FontAwesomeIcon icon={Icons.Lock} size={64} color={warningColor} />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedText}>
            You don't have permission to access the Admin Panel
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesomeIcon
                icon={Icons.ChevronLeft}
                size={20}
                color={'white'}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{t('admin.panel')}</Text>

            <TouchableOpacity
              onPress={() => refetch()}
              style={styles.refreshButton}
            >
              <FontAwesomeIcon
                icon={Icons.Rotate}
                size={20}
                color={primaryColor}
              />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t('admin.total')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {stats.admins}
              </Text>
              <Text style={styles.statLabel}>{t('admin.admins')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {stats.moderators}
              </Text>
              <Text style={styles.statLabel}>{t('admin.moderators')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FFD700' }]}>
                {stats.premium}
              </Text>
              <Text style={styles.statLabel}>{t('admin.premium')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: warningColor }]}>
                {stats.disabled}
              </Text>
              <Text style={styles.statLabel}>{t('admin.disabled')}</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <FontAwesomeIcon
            icon={Icons.Search}
            size={16}
            color={separatorColor}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('admin.searchUsers')}
            placeholderTextColor={separatorColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <FontAwesomeIcon
                icon={Icons.Remove}
                size={16}
                color={separatorColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* User List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>{t('admin.loadingUsers')}</Text>
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={filteredUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <UserItem
                user={item}
                onUserPress={handleUserPress}
                currentUserRole={role}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            extraData={searchQuery}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon
                  icon={Icons.User}
                  size={48}
                  color={separatorColor}
                />
                <Text style={styles.emptyText}>{t('admin.noUsersFound')}</Text>
              </View>
            }
          />
        )}

        {/* User Actions Modal */}
        <Modal
          visible={selectedUser !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedUser(null)}
        >
          <BlurView intensity={100} tint="dark" style={styles.modalOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setSelectedUser(null)}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedUser?.name}</Text>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                  <FontAwesomeIcon icon={Icons.Remove} size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>

              <View style={styles.modalActions}>
                {/* Role Change (Admin only) */}
                {isAdmin && (
                  <>
                    <Text style={styles.actionSectionTitle}>
                      {t('admin.changeRole')}
                    </Text>
                    <View style={styles.roleButtons}>
                      {[RoleEnum.USER, RoleEnum.MODERATOR, RoleEnum.ADMIN].map(
                        roleOption => (
                          <TouchableOpacity
                            key={roleOption}
                            style={[
                              styles.roleButton,
                              selectedUser?.role === roleOption &&
                                styles.roleButtonActive,
                            ]}
                            onPress={() => handleChangeRole(roleOption)}
                            disabled={selectedUser?.role === roleOption}
                          >
                            <Text
                              style={[
                                styles.roleButtonText,
                                selectedUser?.role === roleOption &&
                                  styles.roleButtonTextActive,
                              ]}
                            >
                              {roleOption}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </>
                )}

                {/* Premium Toggle (Admin only) */}
                {isAdmin && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.premiumButton]}
                    onPress={handleTogglePremium}
                  >
                    <FontAwesomeIcon
                      icon={Icons.Crown}
                      size={18}
                      color="#FFD700"
                    />
                    <Text style={styles.actionButtonText}>
                      {selectedUser?.premium
                        ? t('admin.revokePremium')
                        : t('admin.grantPremium')}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Disable Toggle */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.warningButton]}
                  onPress={handleToggleDisabled}
                >
                  <FontAwesomeIcon
                    icon={selectedUser?.disabled ? Icons.Check : Icons.Lock}
                    size={18}
                    color={warningColor}
                  />
                  <Text
                    style={[styles.actionButtonText, { color: warningColor }]}
                  >
                    {selectedUser?.disabled
                      ? t('admin.enableUser')
                      : t('admin.disableUser')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: primaryColor,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: separatorColor,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  userItemDisabled: {
    opacity: 0.5,
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  userEmail: {
    fontSize: 14,
    color: separatorColor,
    marginBottom: 6,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userId: {
    fontSize: 12,
    color: separatorColor,
  },
  disabledBadge: {
    backgroundColor: 'rgba(254, 120, 120, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  disabledText: {
    fontSize: 10,
    fontWeight: '700',
    color: warningColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: separatorColor,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: separatorColor,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: warningColor,
  },
  unauthorizedText: {
    fontSize: 16,
    color: separatorColor,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: primaryBgColor,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: separatorColor,
    marginBottom: 24,
  },
  modalActions: {
    gap: 16,
  },
  actionSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: separatorColor,
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: 'rgba(16, 217, 185, 0.2)',
    borderColor: primaryColor,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: separatorColor,
  },
  roleButtonTextActive: {
    color: primaryColor,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 217, 185, 0.2)',
  },
  premiumButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  warningButton: {
    backgroundColor: 'rgba(254, 120, 120, 0.1)',
    borderColor: 'rgba(254, 120, 120, 0.2)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
