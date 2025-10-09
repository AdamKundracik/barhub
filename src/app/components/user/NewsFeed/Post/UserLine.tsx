import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
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
import { Post } from '@/common/types/postTypes';
import { UserInfo } from '@/shared';
import {
  postBgColor,
  primaryColor,
  separatorColor,
} from '@/src/app/utils/styles/colors';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  ReasonTypeEnum,
  reportService,
} from '@/src/app/services/reportService';
import { PostOptionsModal } from '@/src/app/components/shared/Modals/PostOptionsModal';
import postService from '@/src/app/utils/services/post.service';
import { useQueryClient } from 'react-query';
import { usePlaceStore } from '@/src/app/utils/store/placesStore';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import FastImage from 'react-native-fast-image';
import { useUserStore } from '@/src/app/utils/store/userStore';

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
  date: Date | string | number | any | undefined; // Can be Date, string, number, or serialized object from cache
  address: string | undefined;
  profileImage: string | null | undefined;
  user: UserInfo | undefined | null;
  postId: string | undefined;
  postUserId: string | undefined;
  canDelete?: boolean; // Permission from backend
  canReport?: boolean; // Permission from backend
  canHighlight?: boolean; // Permission from backend
};

const UserLineComponent = ({
  postId,
  user,
  date,
  address,
  postUserId,
  canDelete = false,
  canReport = false,
  canHighlight = false,
}: Props) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // --- ENHANCED TIME FORMATTING ---
  const formattedTime = useMemo(() => {
    if (!date) return '';

    try {
      // Convert to Date object if needed (React Query cache may serialize Date to string/object)
      let dateObj: Date;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        // Firestore Timestamp
        dateObj = date.toDate();
      } else {
        return '';
      }

      // Validate date
      if (isNaN(dateObj.getTime())) {
        return '';
      }

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
      console.error('Error formatting date:', error, date);
      return '';
    }
  }, [date]);

  // Use permissions from backend instead of calculating locally
  // Backend already handles ownership and role checks

  const safeUserName = user?.displayName || 'Unknown User';
  const safeAddress = address || '';

  // --- CALLBACKS ---
  const handleReport = useCallback(
    async (reason: ReportReason, customReason?: string) => {
      const currentUserId = useUserStore.getState().getUserId();

      if (!postId || !currentUserId) {
        showErrorToast(t('error'), 'Missing post or user information');
        return;
      }

      try {
        // Convert ReportReason to ReasonTypeEnum (they match now after enum update)
        const backendReason = reason as unknown as ReasonTypeEnum;

        await reportService.createReport(
          currentUserId,
          postId, // reportService handles string to number conversion
          backendReason,
          customReason
        );

        showSuccessToast(
          t('reportPost.successTitle'),
          t('reportPost.successDescription')
        );
      } catch (error: any) {
        console.error('Failed to report post:', error);
        showErrorToast(t('error'), error.message || t('something-went-wrong'));
      } finally {
        setIsReportModalOpen(false);
      }
    },
    [postId, showSuccessToast, showErrorToast, t]
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
    async (targetPostId: string, targetPlaceId: string | null) => {
      if (!targetPostId) return;

      try {
        const result = await postService.deletePost(targetPostId);
        if (!result.success) throw new Error('Failed to delete post');

        // Update main posts cache
        queryClient.setQueryData(['posts'], (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          
          const newPages = oldData.pages.map((page: any) => {
            if (!page || !Array.isArray(page.posts)) return page;
            
            return {
              ...page,
              posts: page.posts.filter((p: Post) => p.id !== targetPostId),
            };
          });
          
          return {
            ...oldData,
            pages: newPages,
            pageParams: oldData.pageParams || [],
          };
        });

        // Update place-specific cache if applicable
        if (targetPlaceId) {
          queryClient.setQueryData(['posts', targetPlaceId], (oldData: any) => {
            if (!oldData || !oldData.pages) return oldData;
            
            const newPages = oldData.pages.map((page: any) => {
              if (!page || !Array.isArray(page.posts)) return page;
              
              return {
                ...page,
                posts: page.posts.filter((p: Post) => p.id !== targetPostId),
              };
            });
            
            return {
              ...oldData,
              pages: newPages,
              pageParams: oldData.pageParams || [],
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
    [queryClient, showSuccessToast, showErrorToast, t]
  );

  const handleDelete = useCallback(
    () =>
      confirmDelete(() => {
        if (postId) {
          deletePost(postId, placeId);
        }
      }),
    [confirmDelete, deletePost, postId, placeId]
  );

  // Don't render if essential data is missing
  if (!postId) {
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
        showDelete={canDelete}
        showReport={canReport}
        showHighlight={canHighlight}
        visible={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        onDelete={handleDelete}
        onReport={() => {
          setIsOptionsModalOpen(false);
          setIsReportModalOpen(true);
        }}
        onHighlight={() => {
          // TODO: Implement highlight functionality
          console.log('Highlight post:', postId);
          setIsOptionsModalOpen(false);
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
  // Safely compare dates (handle Date, string, number, or serialized objects)
  const getParsedTime = (date: any): number => {
    if (!date) return 0;
    if (date instanceof Date) return date.getTime();
    if (typeof date === 'string' || typeof date === 'number') return new Date(date).getTime();
    return 0;
  };
  
  const prevTime = getParsedTime(prev.date);
  const nextTime = getParsedTime(next.date);
  
  return (
    prev.postId === next.postId &&
    prev.user?.id === next.user?.id &&
    prevTime === nextTime &&
    prev.address === next.address &&
    prev.postUserId === next.postUserId &&
    prev.canDelete === next.canDelete &&
    prev.canReport === next.canReport &&
    prev.canHighlight === next.canHighlight
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
