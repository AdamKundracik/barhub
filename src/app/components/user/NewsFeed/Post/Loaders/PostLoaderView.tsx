import { MotiScrollView, MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { Dimensions, StyleSheet } from 'react-native';
import { postBgColor } from '../../../../../utils/styles/colors';

const Spacer = ({ height = 16 }) => <MotiView style={{ height }} />;
const TextSpacer = ({ height = 8 }) => <MotiView style={{ height }} />;

const { width } = Dimensions.get('window');

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

          <Skeleton width="100%" height={width} radius={8} />
          <Spacer />
        </MotiView>
      ))}
    </MotiScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 16,
    paddingVertical: 16,
  },
  userLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
  },
  userInfo: {
    marginLeft: 12,
  },
  spacer: {
    height: 8,
  },
  photoSkeleton: {
    marginBottom: 16,
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});

export default PostLoaderView;
