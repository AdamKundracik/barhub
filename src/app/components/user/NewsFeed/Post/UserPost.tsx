import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

import { usePlaceStore } from '@/src/app/utils/store/placesStore';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { Post } from '@/common/types/postTypes';
import { useQueryClient } from 'react-query';
import { postService } from '@/src/app/services/postService';
import { trimPlaceName } from '@/src/app/utils/helper-functions/trimPlaceName';

import PlaceNameSeparator from './PlaceNameSeparator';
import BluredPostFrontView from './BluredPostFrontView';
import { UserLine } from './UserLine';
import InteractionBar from './InteractionBar';
import { postBgColor, primaryBgColor } from '@/src/app/utils/styles/colors';

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
  onCommentPress: (
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

  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const { getUserId } = useUserStore();

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
        const response = await postService.toggleLike(postId, userId);

        if (response) {
          // Update backend state tracker
          backendLikedState.current = response.liked;

          // Sync UI with actual backend response (source of truth)
          setLiked(response.liked);
          setLikeCount(response.totalLikes);

          // Update React Query cache
          const queryKey = placeId ? ['posts', placeId] : ['posts'];
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData?.pages) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                posts: page.posts.map((p: Post) =>
                  p.id === postId
                    ? {
                        ...p,
                        isLiked: response.liked,
                        likesCount: response.totalLikes,
                      }
                    : p
                ),
              })),
            };
          });
        }
      } catch (error) {
        console.error('Error syncing like with backend:', error);
        // On error, revert to backend state
        setLiked(backendLikedState.current);
        setLikeCount(prev =>
          backendLikedState.current ? prev : Math.max(prev - 1, 0)
        );
      }
    },
    [postId, placeId, queryClient, getUserId]
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

    // Debounce backend sync (500ms)
    // After user stops clicking, sync final UI state with backend
    debounceTimer.current = setTimeout(() => {
      syncWithBackend(newLikedState);
    }, 500);
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
  const { isPremium, canSeeContent } = useUserStore();

  // Early return if no post
  if (!post) {
    return null;
  }

  // Safe destructuring with defaults
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
  } = post;

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
    onCommentPress(id, user?.expoPushToken ?? '', userId);
  }, [id, user?.expoPushToken, userId, onCommentPress]);

  // Computed values
  const shouldShowBlur = useMemo(
    () => !isPremium() && !canSeeContent,
    [isPremium, canSeeContent]
  );

  const trimmedPlaceName = useMemo(() => trimPlaceName(placeName), [placeName]);

  // Don't render if essential data is missing
  if (!id || !photoUrl) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.delay(100).duration(600)}
      style={styles.postContainer}
    >
      {/* Modern Place Name Header */}
      {!isFiltering && (
        <View style={[styles.placeName, isTablet && tabletStyles.placeName]}>
          <PlaceNameSeparator
            placeNameLocal={trimmedPlaceName}
            placeIdLocal={folderId}
          />
        </View>
      )}

      {/* Enhanced Post Card */}
      <View
        style={[
          styles.contentContainer,
          isTablet && tabletStyles.contentContainer,
        ]}
      >
        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={['rgba(16, 217, 185, 0.02)', 'rgba(16, 217, 185, 0.0)']}
          style={styles.gradientOverlay}
        />

        {shouldShowBlur && <BluredPostFrontView />}

        <UserLine
          user={user}
          date={creationTime}
          address={placeAddress}
          profileImage={user?.photoUrl ?? ''}
          postId={id}
          postUserId={userId}
          canDelete={post.canDelete}
          canReport={post.canReport}
          canHighlight={post.canHighlight}
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
          isLiked={liked}
          occupancy={occupancy}
        />
      </View>
    </Animated.View>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  postContainer: {},
  placeName: {
    backgroundColor: primaryBgColor,
    alignItems: 'center',
    paddingVertical: 12,
  },
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
  placeName: {
    paddingVertical: 16,
  },
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
    prevProps.isZoomed === nextProps.isZoomed &&
    prevProps.hasPremium === nextProps.hasPremium &&
    prevProps.isFiltering === nextProps.isFiltering
  );
});
