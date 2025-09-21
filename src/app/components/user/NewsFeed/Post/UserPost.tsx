import { Dimensions, StyleSheet, View } from 'react-native';
import Device from 'react-native-device-info';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { usePlaceStore } from '@/src/app/utils/store/placesStore';
import { Post } from '@/shared';
import { useQueryClient } from 'react-query';
import { useRef, useState } from 'react';
import { toggleLike } from '@/src/app/utils/services/functions';
import { auth } from '@/firebaseConfig';
import { LikeNotificationRequest } from '@/src/app/utils/types/notification-types';
import { sendLikeNotification } from '@/src/app/utils/functions/notofications-handler';
import PlaceNameSeparator from '@/src/app/components/user/NewsFeed/Post/PlaceNameSeparator';
import { trimPlaceName } from '@/src/app/utils/helper-functions/trimPlaceName';
import BluredPostFrontView from '@/src/app/components/user/NewsFeed/Post/BluredPostFrontView';
import UserLine from '@/src/app/components/user/NewsFeed/Post/UserLine';
import InteractionBar from '@/src/app/components/user/NewsFeed/Post/InteractionBar';
import { postBgColor, primaryBgColor } from '@/src/app/utils/styles/colors';

interface PostInterface {
  post: Post;
  numberOfDaysSinceLastPostedPhoto: number;
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

const { width: screenWidth } = Dimensions.get('window');
const isTablet = Device.isTablet();

// Constants for better maintainability
const DEBOUNCE_DELAY = 700;
const DOUBLE_TAP_MAX_DURATION = 250;
const PREMIUM_UPLOAD_THRESHOLD_DAYS = 7;

export const UserPost = (props: PostInterface) => {
  const { post, setZoomedPost, hasPremium, isFiltering, onCommentPress } =
    props;

  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const xCurrent = useSharedValue(0);
  const yCurrent = useSharedValue(0);
  const scale = useSharedValue(1);

  // State management
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState<number>(post.likesCount ?? 0);
  const [previousLikeState, setPreviousLikeState] = useState(!post.isLiked);

  // Optimistic update for like functionality
  const optimisticUpdate = (currentLiked: boolean) => {
    queryClient.setQueryData(
      placeId ? ['posts', placeId] : 'posts',
      (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: Post) =>
              p.id === post.id
                ? {
                    ...p,
                    isLiked: !currentLiked,
                    likesCount: currentLiked
                      ? (p.likesCount ?? 0) - 1
                      : (p.likesCount ?? 0) + 1,
                  }
                : p
            ),
          })),
        };
      }
    );
  };

  const handleLikeToggle = async (postId: string) => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prevCount => (newLikedState ? prevCount + 1 : prevCount - 1));

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        if (liked !== previousLikeState) {
          await toggleLike(postId, auth.currentUser?.uid!);

          // Send notification for new likes (not unlikes)
          if (!liked && post.userId !== auth.currentUser?.uid) {
            const notifRequest: LikeNotificationRequest = {
              postId: postId,
              username: auth.currentUser?.displayName ?? '',
              expoPushToken: post.user?.expoPushToken ?? '',
            };
            await sendLikeNotification(notifRequest);
          }

          setPreviousLikeState(prevState => !prevState);
          optimisticUpdate(liked ?? false);
        }
      } catch (error) {
        console.error('Error updating like status:', error);
        setLiked(previousLikeState);
        setLikeCount(prevCount =>
          previousLikeState ? prevCount + 1 : prevCount - 1
        );
      }
    }, DEBOUNCE_DELAY);
  };

  const doubleTap = Gesture.Tap()
    .maxDuration(DOUBLE_TAP_MAX_DURATION)
    .numberOfTaps(2)
    .onStart(() => {
      handleLikeToggle(post.id);
    });

  const pinch = Gesture.Pinch()
    .onStart(g => {
      if (g.numberOfPointers === 2) {
        focalX.value = g.focalX;
        focalY.value = g.focalY;
      }
      setZoomedPost(post.photoUrl);
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
      scale.value = withTiming(1);
      xCurrent.value = withTiming(0);
      yCurrent.value = withTiming(0);
      setZoomedPost(null);
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: xCurrent.value },
        { translateY: yCurrent.value },
        { scale: scale.value },
      ],
    };
  });

  const shouldNotBlurPost =
    !hasPremium ||
    props.numberOfDaysSinceLastPostedPhoto >= PREMIUM_UPLOAD_THRESHOLD_DAYS;

  return (
    <>
      {/* Place name header - only show when not filtering */}
      {!isFiltering && (
        <View style={[styles.placeName, isTablet && tabletStyles.placeName]}>
          <PlaceNameSeparator
            placeNameLocal={trimPlaceName(post.placeName)}
            placeIdLocal={post.folderId}
          />
        </View>
      )}

      {/* Main post content */}
      <View
        style={[
          styles.contentContainer,
          isTablet && tabletStyles.contentContainer,
        ]}
      >
        {/* Blur overlay for non-premium users */}
        {!shouldNotBlurPost && <BluredPostFrontView />}

        {/* User information line */}
        <UserLine
          user={post.user}
          date={post.creationTime}
          address={post.placeAddress}
          profileImage={post.user?.photoUrl ?? ''}
          postId={post.id}
        />

        {/* Photo container - NxN square where N is screen width */}
        <View style={styles.photoWrapper}>
          <GestureDetector gesture={doubleTap}>
            <GestureDetector gesture={pinch}>
              <Animated.View style={[styles.photoContainer, animatedStyle]}>
                <Image
                  style={[styles.photo, isTablet && tabletStyles.photo]}
                  source={{ uri: post.photoUrl }}
                  priority="high"
                  contentFit="cover"
                />
              </Animated.View>
            </GestureDetector>
          </GestureDetector>
        </View>

        {/* Interaction bar */}
        <InteractionBar
          likes={likeCount}
          comments={post.commentsCount}
          onLikeToggle={() => handleLikeToggle(post.id)}
          onCommentToggle={() =>
            onCommentPress(
              post.id,
              post.user?.expoPushToken ?? '',
              post.userId ?? ''
            )
          }
          isLiked={liked}
          occupancy={post.occupancy}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  placeName: {
    backgroundColor: primaryBgColor,
    alignItems: 'center',
  },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoWrapper: {
    width: screenWidth,
    height: screenWidth, // NxN square where N is screen width
    position: 'relative',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

const tabletStyles = StyleSheet.create({
  placeName: {
    padding: 20,
  },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

export default UserPost;
