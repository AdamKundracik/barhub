import { Dimensions, StyleSheet, View } from 'react-native';
import Device from 'react-native-device-info';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { usePlaceStore } from '@/src/app/utils/store/placesStore';
import { Post } from '@/shared';
import { useQueryClient } from 'react-query';
import React, { useRef, useState } from 'react';
import { toggleLike } from '@/src/app/utils/services/functions';
import { auth } from '@/firebaseConfig';
import PlaceNameSeparator from '@/src/app/components/user/NewsFeed/Post/PlaceNameSeparator';
import { trimPlaceName } from '@/src/app/utils/helper-functions/trimPlaceName';
import BluredPostFrontView from '@/src/app/components/user/NewsFeed/Post/BluredPostFrontView';
import { UserLine } from '@/src/app/components/user/NewsFeed/Post/UserLine';
import InteractionBar from '@/src/app/components/user/NewsFeed/Post/InteractionBar';
import { postBgColor, primaryBgColor } from '@/src/app/utils/styles/colors';
import { useUserStore } from '@/src/app/utils/store/userStore';
import FastImage from 'react-native-fast-image';

interface PostInterface {
  post: Post;
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

const DEBOUNCE_DELAY = 700;
const DOUBLE_TAP_MAX_DURATION = 250;

const UserPost = (props: PostInterface) => {
  const { post, setZoomedPost, isFiltering, onCommentPress } = props;

  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const { premium, canSeeContent } = useUserStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Animation
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const xCurrent = useSharedValue(0);
  const yCurrent = useSharedValue(0);
  const scale = useSharedValue(1);

  // State
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState<number>(post.likesCount ?? 0);
  const [previousLikeState, setPreviousLikeState] = useState(!post.isLiked);

  const [imageAspectRatio, setImageAspectRatio] = useState(0.75); // fallback

  // Optimistic like update
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
    setLikeCount(prev => (newLikedState ? prev + 1 : prev - 1));

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        if (liked !== previousLikeState) {
          await toggleLike(postId, auth.currentUser?.displayName!);
          setPreviousLikeState(prev => !prev);
          optimisticUpdate(liked ?? false);
        }
      } catch (error) {
        console.error('Error updating like status:', error);
        setLiked(previousLikeState);
        setLikeCount(prev => (previousLikeState ? prev + 1 : prev - 1));
      }
    }, DEBOUNCE_DELAY);
  };

  const doubleTap = Gesture.Tap()
    .maxDuration(DOUBLE_TAP_MAX_DURATION)
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(handleLikeToggle)(post.id);
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: xCurrent.value },
      { translateY: yCurrent.value },
      { scale: scale.value },
    ],
  }));

  const shouldNotBlurPost = premium || canSeeContent;

  return (
    <>
      {!isFiltering && (
        <View style={[styles.placeName, isTablet && tabletStyles.placeName]}>
          <PlaceNameSeparator
            placeNameLocal={trimPlaceName(post.placeName)}
            placeIdLocal={post.folderId}
          />
        </View>
      )}

      <View
        style={[
          styles.contentContainer,
          isTablet && tabletStyles.contentContainer,
        ]}
      >
        {!shouldNotBlurPost && <BluredPostFrontView />}

        <UserLine
          user={post.user}
          date={post.creationTime}
          address={post.placeAddress}
          profileImage={post.user?.photoUrl ?? ''}
          postId={post.id}
          postUserId={post.userId!}
        />

        <GestureDetector gesture={doubleTap}>
          <GestureDetector gesture={pinch}>
            <Animated.View style={[styles.photoContainer, animatedStyle]}>
              <FastImage
                source={{ uri: post.photoUrl }}
                style={[
                  styles.photo,
                  isTablet && tabletStyles.photo,
                  { aspectRatio: imageAspectRatio }, // dynamická výška
                ]}
                resizeMode={FastImage.resizeMode.cover}
              />
            </Animated.View>
          </GestureDetector>
        </GestureDetector>

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
  placeName: { backgroundColor: primaryBgColor, alignItems: 'center' },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoContainer: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: { width: screenWidth, borderRadius: 20 },
});

const tabletStyles = StyleSheet.create({
  placeName: { padding: 20 },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
    width: screenWidth,
  },
  photo: { width: screenWidth, borderRadius: 20 },
});

export default React.memo(UserPost, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.isZoomed === next.isZoomed &&
    prev.hasPremium === next.hasPremium &&
    prev.isFiltering === next.isFiltering
  );
});
