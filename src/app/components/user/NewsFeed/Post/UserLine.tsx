import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Timestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PostReportModal } from '@/src/app/components/shared/Modals/ReportPostModal';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { useTranslation } from 'react-i18next';
import { Post, UserInfo } from '@/shared';
import {
  postBgColor,
  primaryColor,
  separatorColor,
} from '@/src/app/utils/styles/colors';
import { FirebaseTimestamp } from '@/src/app/utils/types/types';
import { Icons } from '@/src/app/utils/icons/icons';
import reportClient from '@/src/app/utils/services/reports.service';
import { PostOptionsModal } from '@/src/app/components/shared/Modals/PostOptionsModal';
import postService from '@/src/app/utils/services/post.service';
import { useQueryClient } from 'react-query';
import { usePlaceStore } from '@/src/app/utils/store/placesStore';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { getAuth } from 'firebase/auth';
import { useUserRole } from '@/src/app/hooks/useUserRole';
import FastImage from 'react-native-fast-image';

const normalizeTimestamp = (
  timestamp: FirebaseTimestamp | undefined
): Timestamp => {
  if (!timestamp) {
    return new Timestamp(0, 0);
  }
  const seconds = timestamp._seconds || 0;
  const nanoseconds = timestamp._nanoseconds || 0;
  return new Timestamp(seconds, nanoseconds);
};

// Enhanced Avatar Component
const UserAvatar: React.FC<{
  photoUrl?: string | null;
  displayName?: string;
  size?: number;
  showOnlineIndicator?: boolean;
}> = ({
  photoUrl,
  displayName = 'Unknown',
  size = 50,
  showOnlineIndicator = false,
}) => {
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (photoUrl) {
    return (
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        <FastImage
          source={{ uri: photoUrl, priority: FastImage.priority.high }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
        {showOnlineIndicator && <View style={styles.onlineIndicator} />}
      </View>
    );
  }

  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      <LinearGradient
        colors={[primaryColor, '#00B4A6']}
        style={[
          styles.avatarGradient,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.avatarInitials, { fontSize: size * 0.4 }]}>
          {initials}
        </Text>
      </LinearGradient>
      {showOnlineIndicator && <View style={styles.onlineIndicator} />}
    </View>
  );
};

// Enhanced More Options Button
const MoreOptionsButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 200 });
    });
    rotation.value = withSpring(90, { duration: 200 }, () => {
      rotation.value = withSpring(0, { duration: 300 });
    });
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.moreButton}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedStyle}>
        <FontAwesomeIcon
          icon={Icons.EllipsisVertical}
          size={20}
          color={separatorColor}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

type Props = {
  date: FirebaseTimestamp | undefined;
  address: string | undefined;
  profileImage: string | null | undefined;
  user: UserInfo | undefined | null;
  postId: string | undefined;
  postUserId: string | undefined;
};

const UserLineComponent = ({
  postId,
  user,
  date,
  address,
  postUserId,
}: Props) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const auth = getAuth();
  const { hasAdminAccess } = useUserRole();

  // --- ENHANCED TIME FORMATTING ---
  const formattedTime = useMemo(() => {
    if (!date) return '';

    try {
      const dateObj = new Date(normalizeTimestamp(date).toMillis());
      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - dateObj.getTime()) / (1000 * 60)
      );
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      // Ak je menej ako 1 deň, používaj relatívny čas
      if (diffInDays < 1) {
        if (diffInMinutes < 1) {
          return 'práve teraz';
        } else if (diffInMinutes < 60) {
          return `pred ${diffInMinutes} min`;
        } else {
          return `pred ${diffInHours}h`;
        }
      }

      // Ak je viac ako 1 deň, zobraz dátum a čas
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');

      return `${day}.${month}.${year}  ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, [date]);

  const isOwnPost = useMemo(
    () => auth.currentUser?.uid === postUserId,
    [auth.currentUser?.uid, postUserId]
  );

  // Can delete if: own post OR admin/moderator
  const canDeletePost = useMemo(
    () => isOwnPost || hasAdminAccess,
    [isOwnPost, hasAdminAccess]
  );

  const safePostId = postId || '';
  const safeUserId = user?.id || '';
  const safeUserName = user?.displayName || 'Unknown User';
  const safeAddress = address || '';

  // --- CALLBACKS ---
  const handleReport = useCallback(
    async (reason: ReportReason) => {
      if (!safePostId || !safeUserId) {
        showErrorToast('Error', 'Missing post or user information');
        return;
      }

      try {
        await reportClient.reportPost(safeUserId, safePostId, reason);
        showSuccessToast(
          t('reportPost.confirmTitle'),
          t('reportPost.confirmMessage', { reason: t(`reportPost.${reason}`) })
        );
      } catch (error: any) {
        console.error('Failed to report post:', error);
        showErrorToast('Failed to report post', error.message);
      } finally {
        setIsReportModalOpen(false);
      }
    },
    [safePostId, safeUserId, showSuccessToast, showErrorToast, t]
  );

  const confirmDelete = useCallback(
    (onConfirm: () => void) => {
      Alert.alert(
        t('deletePost.confirmTitle'),
        t('deletePost.confirmMessage'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('submit'), style: 'destructive', onPress: onConfirm },
        ],
        { cancelable: true }
      );
    },
    [t]
  );

  const deletePost = useCallback(
    async (postId: string, placeId: string | null) => {
      if (!postId) return;

      try {
        const result = await postService.deletePost(postId);
        if (!result.success) throw new Error('Failed to delete post');

        queryClient.setQueryData(['posts'], (oldData: any) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.filter((p: Post) => p.id !== postId),
          }));
          return {
            ...oldData,
            pages: newPages,
            pageParams: [...oldData.pageParams],
          };
        });

        if (placeId) {
          queryClient.setQueryData(['posts', placeId], (oldData: any) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.filter((p: Post) => p.id !== postId),
            }));
            return {
              ...oldData,
              pages: newPages,
              pageParams: [...oldData.pageParams],
            };
          });
        }

        showSuccessToast(
          t('deletePost.successTitle'),
          t('deletePost.successDescription')
        );
      } catch (error: any) {
        console.error('Failed to delete post:', error);
        showErrorToast('Failed to delete post', error.message);
      } finally {
        setIsOptionsModalOpen(false);
      }
    },
    [queryClient, placeId, showSuccessToast, showErrorToast, t]
  );

  const handleDelete = useCallback(
    () => confirmDelete(() => deletePost(safePostId, placeId)),
    [confirmDelete, deletePost, safePostId, placeId]
  );

  // Don't render if essential data is missing
  if (!safePostId) {
    return null;
  }

  return (
    <>
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <View style={styles.leftSection}>
          <UserAvatar
            photoUrl={user?.photoUrl}
            displayName={safeUserName}
            size={52}
            showOnlineIndicator={false}
          />

          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {safeUserName}
            </Text>

            {/* Adresa na vlastnom riadku - bez ikony a bez marginLeft */}
            {safeAddress && (
              <View style={styles.addressRow}>
                <Text style={styles.address} numberOfLines={2}>
                  {safeAddress}
                </Text>
              </View>
            )}

            {/* Čas na vlastnom riadku - vylepšené formátovanie */}
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>
          </View>
        </View>

        <MoreOptionsButton onPress={() => setIsOptionsModalOpen(true)} />
      </Animated.View>

      <PostOptionsModal
        showDelete={canDeletePost}
        visible={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        onDelete={handleDelete}
        onReport={() => {
          setIsOptionsModalOpen(false);
          setIsReportModalOpen(true);
        }}
      />

      <PostReportModal
        visible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSave={handleReport}
      />
    </>
  );
};

export const UserLine = React.memo(UserLineComponent, (prev, next) => {
  return (
    prev.postId === next.postId &&
    prev.user?.id === next.user?.id &&
    prev.date?._seconds === next.date?._seconds &&
    prev.date?._nanoseconds === next.date?._nanoseconds &&
    prev.address === next.address &&
    prev.postUserId === next.postUserId
  );
});

// Enhanced Styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: postBgColor,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    backgroundColor: '#333',
  },
  avatarGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: postBgColor,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    // marginBottom: 4,
    letterSpacing: 0.3,
  },
  addressRow: {
    marginBottom: 2,
    paddingRight: 20,
  },
  address: {
    fontSize: 13,
    color: separatorColor,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  timeRow: {
    // marginTop odstránený, gap je už malý
  },
  timeText: {
    fontSize: 13,
    color: primaryColor,
    fontWeight: '600',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
