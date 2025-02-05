import { Dimensions, StyleSheet, View } from 'react-native';
import Device from 'react-native-device-info';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Post, User } from '../../../../../../shared';
import { useRef, useState } from 'react';
import { toggleLike } from '../../../../utils/services/functions';
import { auth } from '../../../../../../firebaseConfig';
import PlaceNameSeparator from './PlaceNameSeparator';
import { postBgColor, primaryBgColor } from '../../../../utils/styles/colors';
import UserLine from './UserLine';
import InteractionBar from './InteractionBar';
import BluredPostFrontView from './BluredPostFrontView';
import { daysPassedSince } from '../../../../utils/helper-functions/daysPassedSince';
import FastImage from 'react-native-fast-image';
import { useQueryClient } from 'react-query';
import { usePlaceStore } from '../../../../utils/store/placesStore';
import { trimPlaceName } from '../../../../utils/helper-functions/trimPlaceName';
import { LikeNotificationRequest } from '../../../../utils/types/notification-types';
import { sendLikeNotification } from '../../../../utils/functions/notofications-handler';

interface PostInterface {
  post: Post;
  setZoomedPost: (link: string | null) => void;
  isZoomed: boolean;
  hasPremium: boolean;
  isFiltering: boolean;
  user: User | undefined;
  onCommentPress: (postId: string, expoPushToken: string) => void;
  requestPhoto: () => void;
}

const isTablet = Device.isTablet();

const width = Dimensions.get('window').width;

export const UserPost = (props: PostInterface) => {
  const { post, setZoomedPost } = props;

  const queryClient = useQueryClient();

  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const xCurrent = useSharedValue(0);
  const yCurrent = useSharedValue(0);
  const scale = useSharedValue(1);

  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState<number>(post.likesCount ?? 0);
  const [previousLikeState, setPreviousLikeState] = useState(!post.isLiked);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { placeId } = usePlaceStore();

  const optimisticUpdate = (liked: boolean) => {
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
                    ...p, // Only update the specific post that changed
                    isLiked: !liked,
                    likesCount: liked ? p.likesCount - 1 : p.likesCount + 1,
                  }
                : p
            ),
          })),
        };
      }
    );
  };

  const handleLikeToggle = async (postId: string) => {
    if (liked) {
      setLiked(false);
      setLikeCount(prevCount => prevCount - 1);
    } else {
      setLiked(true);
      setLikeCount(prevCount => prevCount + 1);
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      const notifRequest: LikeNotificationRequest = {
        postId: postId,
        username: post.user?.displayName ?? '',
        expoPushToken: post.user?.expoPushToken ?? '',
      };
      try {
        if (liked !== previousLikeState) {
          await toggleLike(postId, auth.currentUser?.uid!);
          if (!liked) {
            await sendLikeNotification(notifRequest);
          }
          setPreviousLikeState(prevState => !prevState);
          optimisticUpdate(liked);
        }
      } catch (error) {
        console.error('Error updating like status:', error);
        setLiked(previousLikeState);
        setLikeCount(prevCount =>
          previousLikeState ? prevCount + 1 : prevCount - 1
        );
      }
    }, 700);
  };

  const onLikePress = () => {
    handleLikeToggle(post.id);
  };

  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(2)
    .onStart(async () => {
      onLikePress();
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

  return (
    <>
      {!props.isFiltering && (
        <View style={isTablet ? tabletStyles.placeName : styles.placeName}>
          <PlaceNameSeparator
            placeNameLocal={trimPlaceName(post.placeName)}
            placeIdLocal={post.folderId}
          />
        </View>
      )}

      <View
        style={
          isTablet ? tabletStyles.contentContainer : styles.contentContainer
        }
      >
        {!props.hasPremium ||
          (daysPassedSince(
            props.user?.lastUploadedPost ?? new Date().toISOString()
          ) >= 14 && <BluredPostFrontView />)}
        <UserLine
          user={post.user}
          date={post.creationTime}
          address={post.placeAddress}
          profileImage={post.user?.photoUrl ?? ''}
        />
        <View style={{ height: width, position: 'relative' }}>
          <GestureDetector gesture={doubleTap}>
            <GestureDetector gesture={pinch}>
              <Animated.View style={[styles.photoContainer, animatedStyle]}>
                <FastImage
                  style={[isTablet ? tabletStyles.photo : styles.photo]}
                  source={{
                    priority: FastImage.priority.high,
                    uri: post.photoUrl,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </Animated.View>
            </GestureDetector>
          </GestureDetector>
        </View>
        <InteractionBar
          likes={likeCount}
          comments={post.commentsCount}
          onLikeToggle={onLikePress}
          onCommentToggle={() =>
            props.onCommentPress(
              props.post.id,
              props.post.user?.expoPushToken ?? ''
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
  postWrapper: {
    width: '100%',
  },
  userLine: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  placeName: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: primaryBgColor,
  },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userInfo: {
    padding: 15,
    flexShrink: 1,
    marginRight: 10,
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    borderRadius: 20,
    flex: 10,
    width: '100%',
    height: width,
    zIndex: 10,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  commentsList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  iconButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 50,
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
  commentText: {
    fontSize: 16,
  },
  profileImg: {
    width: 32,
    height: 32,
    borderRadius: 50,
  },
  profileText: {
    color: '#ccc000',
  },
  commentBy: {},
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 32,
  },
  commentContent: {
    marginLeft: 10,
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});

const tabletStyles = StyleSheet.create({
  postWrapper: {
    width: '100%',
    height: 'auto',
  },
  placeName: {
    backgroundColor: primaryBgColor,
    padding: 20,
  },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: width,
    borderRadius: 20,
    flex: 10,
  },
  commentsList: {
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginRight: 15,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 40,
  },
  commentContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  commentText: {
    fontSize: 24,
  },
  commentBy: {
    fontSize: 24,
  },
});

export default UserPost;
