import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Animated, {
  FadeIn,
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
  addCacheBuster,
  createImageKey,
} from '@/src/app/utils/cache/imageCacheUtils';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';

// Isolated RelativeTime component - has its own interval, doesn't cause parent re-renders
const RelativeTime: React.FC<{
  date: Date | string | number | any | undefined;
}> = React.memo(({ date }) => {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo(() => {
    if (!date) return '';

    try {
      let dateObj: Date;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (
        typeof date === 'object' &&
        'toDate' in date &&
        typeof date.toDate === 'function'
      ) {
        dateObj = date.toDate();
      } else {
        return '';
      }

      if (isNaN(dateObj.getTime())) {
        return '';
      }

      const diffInMinutes = Math.floor(
        (currentTime - dateObj.getTime()) / (1000 * 60)
      );
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays < 1) {
        if (diffInMinutes < 1) {
          return t('just-now') || 'práve teraz';
        } else if (diffInMinutes < 60) {
          if (
            i18n.language === 'es' ||
            i18n.language === 'sk' ||
            i18n.language === 'de'
          ) {
            return `${t('ago')} ${diffInMinutes} min`;
          }
          return `${diffInMinutes} min ${t('ago')}`;
        } else {
          if (
            i18n.language === 'es' ||
            i18n.language === 'sk' ||
            i18n.language === 'de'
          ) {
            return `${t('ago')} ${diffInHours}h`;
          }
          return `${diffInHours}h ${t('ago')}`;
        }
      }

      const locales = getLocales();
      const userLocale = locales[0]?.languageTag || 'en-US';

      return dateObj.toLocaleString(userLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  }, [date, currentTime, t, i18n.language]);

  return <Text style={styles.timeText}>{formattedTime}</Text>;
});

// Enhanced More Options Button
const MoreOptionsButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

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
      <FontAwesomeIcon
        icon={Icons.EllipsisVertical}
        size={20}
        color={separatorColor}
      />
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
  placeName?: string; // Place name to display
  placeId?: string; // Place ID for navigation
  placeAddress?: string; // Place address
  showPlace?: boolean; // Whether to show place instead of user
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
  placeName,
  placeId: placeIdProp,
  placeAddress,
  showPlace = false,
}: Props) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [localIsHighlighted, setLocalIsHighlighted] = useState(isHighlighted);
  const queryClient = useQueryClient();
  const { placeId: currentPlaceId } = usePlaceStore();
  const { setPlaceId, setPlaceName, setPlaceAddress } = usePlaceStore();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Sync local highlight state with prop when it changes
  useEffect(() => {
    setLocalIsHighlighted(isHighlighted);
  }, [isHighlighted]);

  // Use permissions from backend instead of calculating locally
  // Backend already handles ownership and role checks

  const safeUserName = user?.displayName || 'Unknown User';
  const safeAddress = address || '';
  const safePlaceName = placeName || '';
  const safePlaceAddress = placeAddress || safeAddress;

  // Navigate to place
  const handleNavigateToPlace = useCallback(() => {
    if (placeName && placeIdProp) {
      setPlaceName(placeName);
      setPlaceId(placeIdProp);
      setPlaceAddress(safePlaceAddress);
    }
  }, [
    placeName,
    placeIdProp,
    safePlaceAddress,
    setPlaceName,
    setPlaceId,
    setPlaceAddress,
  ]);

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

        await reportService.reportPost(
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

        // Show error toast with code and message
        const statusCode = error?.response?.status;
        const errorMessage = error?.response?.data?.message || error?.message;

        let description = t('something-went-wrong') || 'Something went wrong';
        if (statusCode || errorMessage) {
          const parts: string[] = [];
          if (statusCode) {
            parts.push(`Code: ${statusCode}`);
          }
          if (errorMessage) {
            parts.push(`Message: ${errorMessage}`);
          }
          if (parts.length > 0) {
            description = `${description}\n${parts.join('\n')}`;
          }
        }

        showErrorToast(t('error') || 'Error', description);
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

        // Show error toast with code and message
        const statusCode = error?.response?.status;
        const errorMessage = error?.response?.data?.message || error?.message;

        let description = t('something-went-wrong') || 'Something went wrong';
        if (statusCode || errorMessage) {
          const parts: string[] = [];
          if (statusCode) {
            parts.push(`Code: ${statusCode}`);
          }
          if (errorMessage) {
            parts.push(`Message: ${errorMessage}`);
          }
          if (parts.length > 0) {
            description = `${description}\n${parts.join('\n')}`;
          }
        }

        showErrorToast(t('error') || 'Error', description);
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
          deletePost(postId, placeIdProp || currentPlaceId);
        }
      }),
    [confirmDelete, deletePost, postId, placeIdProp, currentPlaceId]
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

        // Show error toast with code and message
        let description = t('something-went-wrong') || 'Something went wrong';
        const errorMessage = result.message;
        if (errorMessage) {
          description = `${description}\nMessage: ${errorMessage}`;
        }

        showErrorToast(t('error') || 'Error', description);
      }
    } catch (error: any) {
      console.error('Error toggling highlight:', error);
      // Revert optimistic update
      setLocalIsHighlighted(localIsHighlighted);

      // Check for limit error first
      const errorMessage = error?.response?.data?.message || error?.message;
      if (errorMessage?.includes('limit')) {
        showErrorToast(t('highlight-limit-reached') || 'Limit reached', '');
        return;
      }

      // Show error toast with code and message
      const statusCode = error?.response?.status;

      let description = t('something-went-wrong') || 'Something went wrong';
      if (statusCode || errorMessage) {
        const parts: string[] = [];
        if (statusCode) {
          parts.push(`Code: ${statusCode}`);
        }
        if (errorMessage) {
          parts.push(`Message: ${errorMessage}`);
        }
        if (parts.length > 0) {
          description = `${description}\n${parts.join('\n')}`;
        }
      }

      showErrorToast(t('error') || 'Error', description);
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
                  key={createImageKey('userline', user.id, user.photoUrl)}
                  source={{
                    uri: addCacheBuster(user.photoUrl, user.id),
                  }}
                  style={styles.avatar}
                />
              ) : (
                <AvatarFallbackText className={'text-white'}>
                  {safeUserName}
                </AvatarFallbackText>
              )}
            </Avatar>
          </TouchableOpacity>

          <View style={styles.textContainer}>
            {/* Place name nad userName s šípkou */}
            {showPlace && safePlaceName && (
              <View style={styles.placeNameRow}>
                <TouchableOpacity
                  onPress={handleNavigateToPlace}
                  style={styles.placeNameContainer}
                >
                  <Text style={styles.placeName} numberOfLines={1}>
                    {safePlaceName}
                  </Text>
                  <FontAwesomeIcon
                    icon={Icons.ChevronRight}
                    size={12}
                    color="#E0E0E0"
                    style={styles.placeArrowIcon}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* User name row */}
            <View style={styles.nameRow}>
              <View style={styles.nameWithBadge}>
                <TouchableOpacity onPress={onUserPress} disabled={!onUserPress}>
                  <Text style={styles.name} numberOfLines={1}>
                    {safeUserName}
                  </Text>
                </TouchableOpacity>
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
            </View>

            {/* Čas na vlastnom riadku - vylepšené formátovanie */}
            <View style={styles.timeRow}>
              <RelativeTime date={date} />
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
    prev.onHighlightChange === next.onHighlightChange &&
    prev.placeName === next.placeName &&
    prev.placeId === next.placeId &&
    prev.placeAddress === next.placeAddress &&
    prev.showPlace === next.showPlace
  );
});

// Enhanced Modern Styles
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
  contentWrapper: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  placeNameRow: {
    marginBottom: 1,
  },
  placeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeName: {
    fontSize: 18,
    color: '#E0E0E0',
    fontWeight: '700',
    letterSpacing: 0.2,
    marginRight: 6,
  },
  placeArrowIcon: {
    opacity: 0.7,
  },

  // User Section
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatarSection: {
    marginRight: 12,
  },
  avatarContainer: {
    marginRight: 14,
    width: 48,
    height: 48,
  },
  avatar: {
    borderWidth: 0,
  },
  userTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    letterSpacing: 0.3,
  },

  // Badges
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  highlightBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    marginLeft: 8,
  },

  // Time Section
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
    opacity: 0.8,
  },
  timeText: {
    fontSize: 13,
    color: primaryColor,
    fontWeight: '600',
  },

  // More Button
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 4,
  },
});
