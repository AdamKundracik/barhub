import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PostReportModal } from '@/src/app/components/shared/Modals/ReportPostModal';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';
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
import { useUserStore } from '@/src/app/utils/store/userStore';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';

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
  canReportUser?: boolean; // Permission from backend to report user
  canHighlight?: boolean; // Permission from backend
  isHighlighted?: boolean; // Current highlight state
  imageUrl?: string; // Post image URL for saving to gallery
  onPress?: () => void; // Optional callback when UserLine is pressed
  onUserPress?: () => void; // Optional callback when user avatar/name is pressed
  onShare?: () => void; // Optional callback for sharing post
  onHighlightChange?: (isHighlighted: boolean) => void; // Callback when highlight state changes
  onViewDetail?: () => void; // Optional callback for viewing post detail
};

const UserLineComponent = ({
  postId,
  user,
  date,
  address,
  canDelete = false,
  canReport = false,
  canReportUser = false,
  canHighlight = false,
  isHighlighted = false,
  imageUrl,
  onPress,
  onUserPress,
  onShare,
  onHighlightChange,
  onViewDetail,
}: Props) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [localIsHighlighted, setLocalIsHighlighted] = useState(isHighlighted);
  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const { t, i18n } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Sync local highlight state with prop when it changes
  useEffect(() => {
    setLocalIsHighlighted(isHighlighted);
  }, [isHighlighted]);

  // --- ENHANCED TIME FORMATTING WITH AUTO-UPDATE ---
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for live time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo(() => {
    if (!date) return '';

    try {
      // Convert to Date object if needed (React Query cache may serialize Date to string/object)
      let dateObj: Date;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        // Parse date string - if it has Z suffix, it's already UTC
        // JavaScript will correctly convert to local time
        dateObj = new Date(date);
      } else if (
        typeof date === 'object' &&
        'toDate' in date &&
        typeof date.toDate === 'function'
      ) {
        // Firestore Timestamp
        dateObj = date.toDate();
      } else {
        return '';
      }

      // Validate date
      if (isNaN(dateObj.getTime())) {
        return '';
      }

      // Calculate difference using current time (updates every minute)
      const diffInMinutes = Math.floor(
        (currentTime.getTime() - dateObj.getTime()) / (1000 * 60)
      );
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      // Ak je menej ako 1 deň, používaj relatívny čas
      if (diffInDays < 1) {
        if (diffInMinutes < 1) {
          return t('just-now') || 'práve teraz';
        } else if (diffInMinutes < 60) {
          // Special handling for Spanish - "hace X min" instead of "X min hace"
          if (i18n.language === 'es') {
            return `${t('ago')} ${diffInMinutes} min`;
          }
          return `${diffInMinutes} min ${t('ago')}`;
        } else {
          // Special handling for Spanish - "hace Xh" instead of "Xh hace"
          if (i18n.language === 'es') {
            return `${t('ago')} ${diffInHours}h`;
          }
          return `${diffInHours}h ${t('ago')}`;
        }
      }

      // Ak je viac ako 1 deň, zobraz dátum a čas v lokálnej časovej zóne
      const locales = getLocales();
      const userLocale = locales[0]?.languageTag || 'en-US';

      const formattedDate = dateObj.toLocaleString(userLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  }, [date, currentTime, t]);

  // Use permissions from backend instead of calculating locally
  // Backend already handles ownership and role checks

  const safeUserName = user?.displayName || 'Unknown User';
  const safeAddress = address || '';

  // --- CALLBACKS ---
  const handleReport = useCallback(
    async (reason: ReportReason, customReason?: string) => {
      const currentUserId = useUserStore.getState().getUserId();

      if (!postId || !currentUserId) {
        showErrorToast(t('error'), t('errors.missingPostUserInfo'));
        return;
      }

      try {
        // Convert ReportReason to ReasonTypeEnum (they match now after enum update)
        const backendReason = reason as unknown as ReasonTypeEnum;

        await reportService.createReport(
          parseInt(currentUserId, 10),
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
        const result: { success: boolean; message?: string } =
          await postService.deletePost(targetPostId);
        if (!result.success) {
          throw new Error(result.message || 'Failed to delete post');
        }

        // Invalidate all related queries after delete
        queryClient.invalidateQueries(['posts']); // Refresh main feed
        queryClient.invalidateQueries(['userHighlights']); // Refresh highlights (in case deleted post was highlighted)

        if (targetPlaceId) {
          queryClient.invalidateQueries(['posts', targetPlaceId]); // Refresh place-specific feed
        }

        showSuccessToast(
          t('deletePost.successTitle'),
          t('deletePost.successDescription')
        );
      } catch (error: any) {
        console.error('Failed to delete post:', error);
        showErrorToast(t('errors.failedToDeletePost'), error.message);
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

  const handleHighlight = useCallback(async () => {
    if (!postId) return;

    const userId = useUserStore.getState().getUserId();
    if (!userId) {
      showErrorToast(t('error'), t('user-not-found'));
      return;
    }

    try {
      const { postService: postServiceInstance } = await import(
        '@/src/app/services/postService'
      );

      // Optimistic update
      setLocalIsHighlighted(!localIsHighlighted);

      // Call backend
      const result = await postServiceInstance.toggleHighlight(
        postId,
        parseInt(userId, 10),
        localIsHighlighted
      );

      if (result.success) {
        setLocalIsHighlighted(result.isHighlighted);

        // Notify parent component
        onHighlightChange?.(result.isHighlighted);

        // Update ALL posts feed caches - catches main feed and all placeId filters
        queryClient.setQueriesData(['posts'], (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (!page || !Array.isArray(page.posts)) return page;

              return {
                ...page,
                posts: page.posts.map((p: any) =>
                  p.id === postId
                    ? { ...p, isHighlighted: result.isHighlighted }
                    : p
                ),
              };
            }),
            pageParams: oldData.pageParams || [],
          };
        });

        // 3. Update userHighlights cache (for profile grid)
        queryClient.invalidateQueries(['userHighlights']);

        // Show success toast
        showSuccessToast(
          result.isHighlighted
            ? t('highlight-success')
            : t('unhighlight-success'),
          ''
        );
      } else {
        // Revert optimistic update on failure
        setLocalIsHighlighted(localIsHighlighted);
        showErrorToast(
          t('highlight-error'),
          result.message || t('something-went-wrong')
        );
      }
    } catch (error: any) {
      console.error('Error toggling highlight:', error);
      // Revert optimistic update
      setLocalIsHighlighted(localIsHighlighted);

      // Show user-friendly error
      const errorMessage = error?.message || t('something-went-wrong');
      if (errorMessage.includes('limit')) {
        showErrorToast(t('highlight-limit-reached'), '');
      } else {
        showErrorToast(t('highlight-error'), errorMessage);
      }
    } finally {
      setIsOptionsModalOpen(false);
    }
  }, [
    postId,
    localIsHighlighted,
    onHighlightChange,
    queryClient,
    showSuccessToast,
    showErrorToast,
    t,
  ]);

  // Don't render if essential data is missing
  if (!postId) {
    return null;
  }

  return (
    <>
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <TouchableOpacity
          style={styles.leftSection}
          onPress={onPress}
          activeOpacity={onPress ? 0.7 : 1}
          disabled={!onPress}
        >
          <TouchableOpacity
            style={styles.userSection}
            onPress={onUserPress}
            activeOpacity={onUserPress ? 0.7 : 1}
            disabled={!onUserPress}
          >
            <Avatar size="md" style={styles.avatarContainer}>
              {user?.photoUrl ? (
                <AvatarImage
                  source={{ uri: user.photoUrl }}
                  style={styles.avatar}
                />
              ) : (
                <AvatarFallbackText style={styles.avatarFallback}>
                  {safeUserName}
                </AvatarFallbackText>
              )}
            </Avatar>
          </TouchableOpacity>

          <View style={styles.textContainer}>
            <View style={styles.nameRow}>
              <TouchableOpacity onPress={onUserPress} disabled={!onUserPress}>
                <Text style={styles.name} numberOfLines={1}>
                  {safeUserName}
                </Text>
              </TouchableOpacity>
              {user?.role === 'ADMIN' && (
                <View style={styles.roleBadge}>
                  <View style={[styles.roleDot, { backgroundColor: '#FF6B6B' }]} />
                </View>
              )}
              {user?.role === 'MODERATOR' && (
                <View style={styles.roleBadge}>
                  <View style={[styles.roleDot, { backgroundColor: '#007AFF' }]} />
                </View>
              )}
              {localIsHighlighted && (
                <View style={styles.highlightBadge}>
                  <FontAwesomeIcon
                    icon={Icons.Bolt}
                    size={14}
                    color="#FFC107"
                  />
                </View>
              )}
            </View>

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
        </TouchableOpacity>

        <MoreOptionsButton onPress={() => setIsOptionsModalOpen(true)} />
      </Animated.View>

      <PostOptionsModal
        showDelete={canDelete}
        showReport={canReport}
        showHighlight={canHighlight}
        isHighlighted={localIsHighlighted}
        imageUrl={imageUrl}
        visible={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        onDelete={handleDelete}
        onReport={() => {
          setIsOptionsModalOpen(false);
          setIsReportModalOpen(true);
        }}
        onHighlight={handleHighlight}
        onShare={onShare}
        onViewDetail={onViewDetail}
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
    if (typeof date === 'string' || typeof date === 'number')
      return new Date(date).getTime();
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
    prev.canHighlight === next.canHighlight &&
    prev.isHighlighted === next.isHighlighted &&
    prev.onPress === next.onPress &&
    prev.onUserPress === next.onUserPress &&
    prev.onShare === next.onShare &&
    prev.onHighlightChange === next.onHighlightChange
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 14,
    width: 48,
    height: 48,
  },
  avatar: {
    borderWidth: 0,
  },
  avatarFallback: {
    backgroundColor: 'transparent',
    color: 'white',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  highlightBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  roleBadge: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
