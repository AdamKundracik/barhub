import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Device from 'react-native-device-info'; // Import Device
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Post } from '../../../../../../shared';
import { useEffect, useState } from 'react';
import {
  addCommentToPost,
  checkLikeStatus,
  fetchCommentsForPost,
  toggleLike,
} from '../../../../utils/services/functions';
import { auth } from '../../../../../../firebaseConfig';
import useDebounce from '../../../../utils/hooks/useDebounce';
import PlaceNameSeparator from './PlaceNameSeparator';
import { postBgColor, primaryBgColor } from '../../../../utils/styles/colors';
import UserLine from './UserLine';
import InteractionBar from './InteractionBar';
import { getTimeAgoFromTimestampSeconds } from '../../../../utils/helper-functions/timeAgo';
import { useTranslation } from 'react-i18next';

interface PostInterface {
  post: Post;
  setZoomedPost: (link: string | null) => void;
  isZoomed: boolean;
  hasPremium: boolean;
  isFiltering: boolean;
}

type ItemProps = {
  userName: string;
  commentText: string;
  creationTime: any;
  id: string;
  userId: string;
  userPhotoUrl: string;
};

const isTablet = Device.isTablet();

const width = Dimensions.get('window').width;

export const UserPost = (props: PostInterface) => {
  const { post, setZoomedPost, isZoomed } = props;
  const { t } = useTranslation();

  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const xCurrent = useSharedValue(0);
  const yCurrent = useSharedValue(0);
  const scale = useSharedValue(1);

  const [likeStatus, setLikeStatus] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<ItemProps[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (auth.currentUser?.uid) {
      checkLikeStatus(post.id, auth.currentUser.uid).then(data =>
        setLikeStatus(data.data)
      );
    }
  }, [auth.currentUser?.uid, post.id]);

  useEffect(() => {
    const loadComments = async () => {
      const fetchedComments = await fetchCommentsForPost(post.id);
      setComments(fetchedComments);
    };

    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const handleLikeToggle = async () => {
    if (auth.currentUser?.uid) {
      setLikeStatus(!likeStatus);
      useDebounce(async () => {
        await toggleLike(post.id, auth.currentUser!.uid).then(() => {
          checkLikeStatus(post.id, auth.currentUser!.uid);
        });
      }, 1000);
    }
  };

  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(2)
    .onStart(async () => {
      await handleLikeToggle();
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
      // Animate values back to original states
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

  const handleAddComment = async () => {
    if (
      newComment &&
      auth.currentUser?.displayName &&
      auth.currentUser.photoURL
    ) {
      await addCommentToPost(
        post.id,
        auth.currentUser?.uid!,
        auth.currentUser?.displayName,
        auth.currentUser?.photoURL,
        newComment.trim()
      );
      setNewComment('');

      const updatedComments = await fetchCommentsForPost(post.id);
      setComments(updatedComments);
    }
  };

  return (
    <>
      {!props.isFiltering && (
        <View style={isTablet ? tabletStyles.placeName : styles.placeName}>
          <PlaceNameSeparator
            placeName={post.placeName}
            placeId={post.folderId}
          />
        </View>
      )}
      <View
        style={
          isTablet ? tabletStyles.contentContainer : styles.contentContainer
        }
      >
        <UserLine
          name={post.name}
          date={new Date(post.creationTime).toLocaleString()}
          address={post.placeAddress}
          profileImage={post.userImageUrl}
        />
        <View style={{ height: width }}>
          <GestureDetector gesture={doubleTap}>
            <GestureDetector gesture={pinch}>
              <Animated.Image
                blurRadius={!props.hasPremium ? 50 : 0}
                style={[
                  isTablet ? tabletStyles.photo : styles.photo,
                  animatedStyle,
                ]}
                source={{
                  uri: post.photoUrl,
                }}
                resizeMode="cover"
              />
            </GestureDetector>
          </GestureDetector>
        </View>
        <InteractionBar
          likes={post.likesCount}
          comments={post.commentsCount}
          onLikeToggle={handleLikeToggle}
          onCommentToggle={handleAddComment}
          isLiked={likeStatus}
        />
      </View>

      <View style={isTablet ? tabletStyles.commentsList : styles.commentsList}>
        {comments.map((comment, index) => (
          <View
            key={index}
            style={isTablet ? tabletStyles.commentItem : styles.commentItem}
          >
            <View
              style={isTablet ? tabletStyles.profileImg : styles.profileImg}
            >
              <Image
                style={
                  isTablet ? tabletStyles.profilePicture : styles.profilePicture
                }
                height={32}
                width={32}
                source={
                  comment?.userPhotoUrl
                    ? { uri: comment?.userPhotoUrl }
                    : require('../../../../../../assets/userIcon.png')
                }
              ></Image>
            </View>
            <View
              style={
                isTablet ? tabletStyles.commentContent : styles.commentContent
              }
            >
              <Text
                style={isTablet ? tabletStyles.commentBy : styles.commentBy}
              >
                {comment.userName}{' '}
                {getTimeAgoFromTimestampSeconds(comment.creationTime._seconds)}
              </Text>
              <Text
                style={isTablet ? tabletStyles.commentText : styles.commentText}
              >
                {comment.commentText}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {showComments && (
        <View
          style={isTablet ? tabletStyles.inputContainer : styles.inputContainer}
        >
          <TextInput
            style={isTablet ? tabletStyles.input : styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
          />
          <TouchableOpacity
            onPress={handleAddComment}
            style={isTablet ? tabletStyles.button : styles.button}
          >
            <Text
              style={isTablet ? tabletStyles.buttonText : styles.buttonText}
            >
              {t('save')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

// Define the styles for mobile devices
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
    backgroundColor: 'grey',
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
  photo: {
    borderRadius: 20,
    flex: 10,
    width: '100%',
    height: width,
    zIndex: 1000,
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

// Define the styles for tablets
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
