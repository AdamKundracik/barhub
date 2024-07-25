import { StyleSheet, Text, View } from 'react-native';
import { commonAppStyles } from '../../utils/styles/styles';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { PostUrlExtended } from '../../../../shared';
import { timeAgo } from '../../utils/helper-functions/timeAgo';

interface PostInterface {
  post: PostUrlExtended;
  setZoomedPost: (link: string | null) => void;
  isZoomed: boolean;
}

export const UserPost = (props: PostInterface) => {
  const { post, setZoomedPost, isZoomed } = props;
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const xCurrent = useSharedValue(0);
  const yCurrent = useSharedValue(0);
  const scale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onStart(g => {
      if (g.numberOfPointers === 2) {
        focalX.value = g.focalX;
        focalY.value = g.focalY;
      }
      setZoomedPost(post.url);
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

  const createdAgo = timeAgo(post.creationTime.toString());

  return (
    <View style={styles.postWrapper}>
      <View style={styles.userLine}>
        <View style={styles.userInfo}>
          <Text style={commonAppStyles.textPrimary}>{post.name}</Text>
          <Text style={commonAppStyles.textPrimary}>{post.placeName}</Text>
          <Text style={commonAppStyles.textPrimary}>{post.placeAddress}</Text>
        </View>
        <Text style={commonAppStyles.textPrimary}>{createdAgo}</Text>
      </View>
      <GestureDetector gesture={pinch}>
        <Animated.Image
          style={[styles.photo, animatedStyle]}
          source={{
            uri: post.url,
          }}
        />
      </GestureDetector>
      <View style={styles.photoActions}>
        <FontAwesomeIcon color="white" icon={Icons.Heart} />
        <FontAwesomeIcon color="white" icon={Icons.Comment} />
        <FontAwesomeIcon color="white" icon={Icons.ShareAlt} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postWrapper: {
    width: '100%',
    height: 600,
    backgroundColor: 'white',
  },
  userLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#424242',
    paddingVertical: 5,
  },
  userInfo: {
    flexShrink: 1,
    marginRight: 10,
  },
  photo: {
    flex: 10,
    width: '100%',
    height: '100%',
    zIndex: 1000,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#424242',
  },
});

export default UserPost;
