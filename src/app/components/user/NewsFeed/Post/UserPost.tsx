import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Device from 'react-native-device-info';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useUserStore } from '@/src/app/utils/store/userStore';
import { Post } from '@/src/app/types/postTypes';
import { postService } from '@/src/app/services/postService';
import { trimPlaceName } from '@/src/app/utils/helper-functions/trimPlaceName';

import { UserLine } from './UserLine';
import InteractionBar from './InteractionBar';
import { postBgColor } from '@/src/app/utils/styles/colors';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useTranslation } from 'react-i18next';
import {
  LikedUser,
  LikedUsersModal,
} from '@/src/app/components/shared/Modals/LikedUsersModal';
import { PostCommentsModal } from './Comments/PostCommentsModal';

// Constants
const isTablet = Device.isTablet();
const DOUBLE_TAP_MAX_DURATION = 250;
const IMAGE_ASPECT_RATIO = 0.75;
const CARD_MARGIN = 16;
const CARD_BORDER_RADIUS = 24;

// Types
interface UserPostProps {
  post: Post | null | undefined;
  setZoomedPost: (link: string | null) => void;
  isZoomed: boolean;
  hasPremium: boolean;
  isFiltering: boolean;
  onCommentPress?: (
    postId: string,
    expoPushToken: string,
    userId: string
  ) => void;
  requestPhoto: () => void;
}

// Custom hooks
const usePostLike = (
  initialLiked: boolean,
  initialCount: number,
  postId: string
) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);

  // Track what backend currently has
  const backendLikedState = useRef(initialLiked);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { getUserId } = useUserStore();
  const { showErrorToast } = useCustomToast();
  const { t } = useTranslation();

  // Reset state when post changes (when component is reused for different post)
  useEffect(() => {
    setLiked(initialLiked);
    setLikeCount(initialCount);
    backendLikedState.current = initialLiked;

    // Clear any pending debounce timer when post changes
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, [postId, initialLiked, initialCount]);

  const syncWithBackend = useCallback(
    async (currentUIState: boolean) => {
      // Only call API if UI state differs from backend state
      if (currentUIState === backendLikedState.current) {
        return; // States match - no API call needed
      }

      try {
        const userId = getUserId();
        if (!userId) {
          throw new Error('User not found');
        }
        // Call backend API to toggle
        const response = await postService.toggleLike(
          postId,
          parseInt(userId, 10)
        );

        if (response) {
          // Update backend state tracker
          backendLikedState.current = response.liked;

          // Sync UI with actual backend response (source of truth)
          setLiked(response.liked);
          setLikeCount(response.totalLikes);

          // Don't update cache - let natural refetch handle it
          // This prevents issues with cache corruption where all posts at position 0 get liked
        } else {
          // Response is null - API call failed
          throw new Error('Failed to toggle like - no response from server');
        }
      } catch (error: any) {
        console.error('Error syncing like with backend:', error);
        // On error, revert to backend state
        setLiked(backendLikedState.current);
        setLikeCount(prev =>
          backendLikedState.current ? prev : Math.max(prev - 1, 0)
        );

        // Show error toast with code and message (same structure as other errors)
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
      }
    },
    [postId, getUserId, showErrorToast, t]
  );

  const handleLikeToggle = useCallback(() => {
    if (!postId) return;

    // Immediate optimistic UI update
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => (newLikedState ? prev + 1 : Math.max(prev - 1, 0)));

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce backend sync (800ms) - prevents spam clicking
    // After user stops clicking, sync final UI state with backend
    debounceTimer.current = setTimeout(() => {
      syncWithBackend(newLikedState);
    }, 800);
  }, [liked, postId, syncWithBackend]);

  return { liked, likeCount, handleLikeToggle };
};

const useImageGestures = (
  photoUrl: string | undefined,
  setZoomedPost: (url: string | null) => void
) => {
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const xCurrent = useSharedValue(0);
  const yCurrent = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: xCurrent.value },
      { translateY: yCurrent.value },
      { scale: scale.value },
    ],
  }));

  const resetAnimation = useCallback(() => {
    scale.value = withTiming(1, { duration: 300 });
    xCurrent.value = withTiming(0, { duration: 300 });
    yCurrent.value = withTiming(0, { duration: 300 });
  }, []);

  const pinchGesture = useMemo(() => {
    if (!photoUrl) return null;

    return Gesture.Pinch()
      .onStart(g => {
        if (g.numberOfPointers === 2) {
          focalX.value = g.focalX;
          focalY.value = g.focalY;
        }
        setZoomedPost(photoUrl);
      })
      .onUpdate(g => {
        if (g.scale >= 1) {
          scale.value = g.scale;
          const dx = g.focalX - focalX.value;
          const dy = g.focalY - focalY.value;
          xCurrent.value = dx * -(1 - g.scale);
          yCurrent.value = dy * -(1 - g.scale);
        }
      })
      .onEnd(() => {
        resetAnimation();
        setZoomedPost(null);
      })
      .runOnJS(true);
  }, [photoUrl, setZoomedPost, resetAnimation]);

  return { animatedStyle, pinchGesture };
};

// Main component
const UserPost: React.FC<UserPostProps> = ({
  post,
  setZoomedPost,
  isFiltering,
  onCommentPress,
}) => {
  const navigation = useNavigation();

  // State for liked users modal
  const [showLikedUsersModal, setShowLikedUsersModal] = useState(false);
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [loadingLikedUsers, setLoadingLikedUsers] = useState(false);

  // State for comments modal
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Safe destructuring with defaults - MUST be before any hooks
  const {
    id = '',
    isLiked = false,
    likesCount = 0,
    photoUrl = '',
    placeName = '',
    folderId = '',
    placeAddress = '',
    creationTime,
    user,
    userId = '',
    commentsCount = 0,
    occupancy = '',
    isHighlighted = false,
  } = post ?? {};

  // Navigate to PostDetail screen
  const handleNavigateToDetail = useCallback(() => {
    if (!id) return;
    (navigation as any).navigate('PostDetail', { postId: id });
  }, [navigation, id]);

  // Navigate to UserDetail screen
  const handleNavigateToUser = useCallback(() => {
    if (!userId) return;
    (navigation as any).navigate('UserDetail', { userId });
  }, [navigation, userId]);

  // Share post - memoize with stable dependencies
  const handleShare = useCallback(async () => {
    if (!post) return;
    try {
      const { shareService } = await import('@/src/app/services/shareService');
      await shareService.sharePost(post);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [post?.id]); // Only depend on post.id for stability

  // Custom hooks with safe values
  const { liked, likeCount, handleLikeToggle } = usePostLike(
    isLiked,
    likesCount,
    id
  );

  const { animatedStyle, pinchGesture } = useImageGestures(
    photoUrl,
    setZoomedPost
  );

  // Gesture handlers
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(DOUBLE_TAP_MAX_DURATION)
        .numberOfTaps(2)
        .onStart(() => {
          runOnJS(handleLikeToggle)();
        }),
    [handleLikeToggle]
  );

  const handleCommentPress = useCallback(() => {
    // Use new modal if available, otherwise fallback to old callback
    if (id) {
      setShowCommentsModal(true);
    }
    // Also call old callback for backward compatibility
    if (onCommentPress) {
      onCommentPress(id, user?.expoPushToken ?? '', userId);
    }
  }, [id, user?.expoPushToken, userId, onCommentPress]);

  // Handle comment added/deleted to refresh count
  const handleCommentAdded = useCallback(() => {
    // Could trigger a refetch of posts if needed
    // For now, the count will update on next load
  }, []);

  const handleCommentDeleted = useCallback(() => {
    // Could trigger a refetch of posts if needed
    // For now, the count will update on next load
  }, []);

  // Handle like long press to show liked users
  const handleLikeLongPress = useCallback(async () => {
    if (id) {
      setLoadingLikedUsers(true);
      try {
        const users = await postService.getLikedUsers(id);
        setLikedUsers(users);
        setShowLikedUsersModal(true);
      } catch (error) {
        console.error('Error fetching liked users:', error);
        // Show error toast if needed
      } finally {
        setLoadingLikedUsers(false);
      }
    }
  }, [id]);

  // Handle user press in liked users modal
  const handleLikedUserPress = useCallback(
    (userId: number) => {
      (navigation as any).navigate('UserDetail', { userId: userId.toString() });
    },
    [navigation]
  );

  // // Computed values
  // const shouldShowBlur = useMemo(() => {
  //   // Don't show blur while user data is loading
  //   if (!userData) {
  //     return false;
  //   }
  //
  //   // const premium = isPremium();
  //   return !canSeeContent;
  // }, [isPremium, canSeeContent, userData, id]);

  const trimmedPlaceName = useMemo(() => trimPlaceName(placeName), [placeName]);

  // Don't render if essential data is missing - after all hooks
  if (!post || !id || !photoUrl) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.delay(100).duration(600)}
      style={styles.postContainer}
    >
      {/* Enhanced Post Card */}
      <View
        style={[
          styles.contentContainer,
          isTablet && tabletStyles.contentContainer,
          isHighlighted &&
            isFiltering && {
              borderWidth: 2,
              borderColor: '#FFC107',
              shadowColor: '#FFC107',
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
            },
        ]}
      >
        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={
            isHighlighted && isFiltering
              ? ['rgba(255, 193, 7, 0.05)', 'rgba(255, 193, 7, 0.0)']
              : ['rgba(16, 217, 185, 0.02)', 'rgba(16, 217, 185, 0.0)']
          }
          style={styles.gradientOverlay}
        />

        {/*{shouldShowBlur && <BluredPostFrontView />}*/}

        <UserLine
          user={user}
          date={creationTime}
          address={placeAddress}
          profileImage={user?.photoUrl ?? ''}
          postId={id}
          postUserId={userId}
          canDelete={post.canDelete}
          canReport={post.canReport}
          canReportUser={post.canReportUser}
          canHighlight={post.canHighlight}
          isHighlighted={isHighlighted}
          imageUrl={photoUrl}
          onPress={handleNavigateToDetail}
          onUserPress={handleNavigateToUser}
          onShare={handleShare}
          onViewDetail={handleNavigateToDetail}
          placeName={!isFiltering ? trimmedPlaceName : undefined}
          placeId={!isFiltering ? folderId : undefined}
          placeAddress={!isFiltering ? placeAddress : undefined}
          showPlace={!isFiltering && !!trimmedPlaceName}
        />

        {/* Enhanced Image Container */}
        <View style={styles.imageWrapper}>
          <GestureDetector gesture={doubleTapGesture}>
            {pinchGesture ? (
              <GestureDetector gesture={pinchGesture}>
                <Animated.View style={[styles.photoContainer, animatedStyle]}>
                  <FastImage
                    source={{
                      uri: photoUrl,
                      priority: FastImage.priority.high,
                    }}
                    style={[
                      styles.photo,
                      isTablet && tabletStyles.photo,
                      { aspectRatio: IMAGE_ASPECT_RATIO },
                    ]}
                    resizeMode={FastImage.resizeMode.cover}
                  />

                  {/* Image overlay gradient for better text readability */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.1)']}
                    style={styles.imageGradient}
                    pointerEvents="none"
                  />
                </Animated.View>
              </GestureDetector>
            ) : (
              <Animated.View style={[styles.photoContainer, animatedStyle]}>
                <FastImage
                  source={{
                    uri: photoUrl,
                    priority: FastImage.priority.high,
                  }}
                  style={[
                    styles.photo,
                    isTablet && tabletStyles.photo,
                    { aspectRatio: IMAGE_ASPECT_RATIO },
                  ]}
                  resizeMode={FastImage.resizeMode.cover}
                />

                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.1)']}
                  style={styles.imageGradient}
                  pointerEvents="none"
                />
              </Animated.View>
            )}
          </GestureDetector>
        </View>

        <InteractionBar
          likes={likeCount}
          comments={commentsCount}
          onLikeToggle={handleLikeToggle}
          onCommentToggle={handleCommentPress}
          onShare={handleShare}
          isLiked={liked}
          occupancy={occupancy}
          isHighlighted={isHighlighted}
          isFiltering={isFiltering}
          onLikeLongPress={handleLikeLongPress}
        />
      </View>

      {/* Liked Users Modal */}
      <LikedUsersModal
        visible={showLikedUsersModal}
        onClose={() => setShowLikedUsersModal(false)}
        users={likedUsers}
        onUserPress={handleLikedUserPress}
        loading={loadingLikedUsers}
      />

      {/* Comments Modal */}
      {id && (
        <PostCommentsModal
          visible={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          postId={id}
          commentsCount={commentsCount}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </Animated.View>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  postContainer: {},
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: CARD_BORDER_RADIUS,
    // marginHorizontal: CARD_MARGIN,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  imageWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  photoContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
});

const tabletStyles = StyleSheet.create({
  contentContainer: {
    marginHorizontal: CARD_MARGIN * 2,
    borderRadius: CARD_BORDER_RADIUS + 4,
  },
  photo: {
    width: '100%',
  },
});

// Memoized export with safe comparison
export default React.memo(UserPost, (prevProps, nextProps) => {
  // Null checks first
  if (!prevProps.post && !nextProps.post) return true;
  if (!prevProps.post || !nextProps.post) return false;

  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.isLiked === nextProps.post.isLiked &&
    prevProps.post.likesCount === nextProps.post.likesCount &&
    prevProps.post.isHighlighted === nextProps.post.isHighlighted &&
    prevProps.isZoomed === nextProps.isZoomed &&
    prevProps.hasPremium === nextProps.hasPremium &&
    prevProps.isFiltering === nextProps.isFiltering
  );
});
