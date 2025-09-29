import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Device from 'react-native-device-info';
import Animated, {
  FadeIn,
  runOnJS,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';
import { LinearGradient } from 'expo-linear-gradient';

import { usePlaceStore } from '@/src/app/utils/store/placesStore';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { Post } from '@/shared';
import { useQueryClient } from 'react-query';
import { toggleLike } from '@/src/app/utils/services/functions';
import { auth } from '@/firebaseConfig';
import { trimPlaceName } from '@/src/app/utils/helper-functions/trimPlaceName';

import PlaceNameSeparator from './PlaceNameSeparator';
import BluredPostFrontView from './BluredPostFrontView';
import { UserLine } from './UserLine';
import InteractionBar from './InteractionBar';
import { postBgColor, primaryBgColor } from '@/src/app/utils/styles/colors';

// Constants
const { width: screenWidth } = Dimensions.get('window');
const isTablet = Device.isTablet();
const DEBOUNCE_DELAY = 700;
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
  const [previousLikeState, setPreviousLikeState] = useState(!initialLiked);

  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const optimisticUpdate = useCallback(
    (currentLiked: boolean) => {
      if (!postId) return;

      const queryKey = placeId ? ['posts', placeId] : 'posts';

      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: Post) =>
              p.id === postId
                ? {
                    ...p,
                    isLiked: !currentLiked,
                    likesCount: currentLiked
                      ? Math.max((p.likesCount ?? 0) - 1, 0)
                      : (p.likesCount ?? 0) + 1,
                  }
                : p
            ),
          })),
        };
      });
    },
    [postId, placeId, queryClient]
  );

  const handleLikeToggle = useCallback(async () => {
    if (!postId) return;

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => (newLikedState ? prev + 1 : Math.max(prev - 1, 0)));

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        if (liked !== previousLikeState && auth.currentUser?.displayName) {
          await toggleLike(postId, auth.currentUser.displayName);
          setPreviousLikeState(prev => !prev);
          optimisticUpdate(liked ?? false);
        }
      } catch (error) {
        console.error('Error updating like status:', error);
        setLiked(previousLikeState);
        setLikeCount(prev =>
          previousLikeState ? prev + 1 : Math.max(prev - 1, 0)
        );
      }
    }, DEBOUNCE_DELAY);
  }, [liked, previousLikeState, postId, optimisticUpdate]);

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
  const { premium, canSeeContent } = useUserStore();

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
    () => !premium && !canSeeContent,
    [premium, canSeeContent]
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
        <Animated.View
          entering={SlideInUp.delay(50).duration(500)}
          style={[styles.placeName, isTablet && tabletStyles.placeName]}
        >
          <PlaceNameSeparator
            placeNameLocal={trimmedPlaceName}
            placeIdLocal={folderId}
          />
        </Animated.View>
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
