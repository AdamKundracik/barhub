import { MotiScrollView, MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { Dimensions, StyleSheet, View } from 'react-native';
import { postBgColor } from '@/src/app/utils/styles/colors';

const Spacer = ({ height = 16 }) => <MotiView style={{ height }} />;
const TextSpacer = ({ height = 8 }) => <MotiView style={{ height }} />;

const { width } = Dimensions.get('window');
const IMAGE_ASPECT_RATIO = 0.75;
const CARD_BORDER_RADIUS = 24;

// Calculate image height based on aspect ratio (0.75 = width/height, so height = width/0.75)
const imageHeight = width / IMAGE_ASPECT_RATIO;

export const PostLoaderView = () => {
  return (
    <MotiScrollView>
      {Array.from({ length: 4 }).map((_, index) => (
        <MotiView
          key={index}
          transition={{
            type: 'timing',
          }}
          style={[styles.container]}
          animate={{ backgroundColor: postBgColor }}
        >
          <MotiView style={styles.userLineContainer}>
            <Skeleton height={50} width={50} radius={25} />
            <MotiView style={styles.userInfo}>
              <Skeleton width={150} height={15} radius={4} />
              <TextSpacer />
              <Skeleton width={100} height={15} radius={4} />
              <TextSpacer />
              <Skeleton width={200} height={15} radius={4} />
            </MotiView>
          </MotiView>

          <View style={styles.imageWrapper}>
            <Skeleton width="100%" height={imageHeight} radius={0} />
          </View>

          {/* Interaction bar skeleton */}
          <MotiView style={styles.interactionBar}>
            <Skeleton width={80} height={32} radius={16} />
            <Skeleton width={80} height={32} radius={16} />
            <Skeleton width={80} height={32} radius={16} />
          </MotiView>
          <Spacer height={12} />
        </MotiView>
      ))}
    </MotiScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: CARD_BORDER_RADIUS,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  userLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    marginLeft: 12,
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

export default PostLoaderView;
