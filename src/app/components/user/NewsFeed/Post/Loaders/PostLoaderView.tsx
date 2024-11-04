import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { Dimensions, StyleSheet } from 'react-native';
import { postBgColor } from '../../../../../utils/styles/colors';

const Spacer = ({ height = 16 }) => <MotiView style={{ height }} />;
const { width } = Dimensions.get('window');

export const PostLoaderView = () => {
  return (
    <MotiView
      transition={{
        type: 'timing',
      }}
      style={[styles.container]}
      animate={{ backgroundColor: postBgColor }}
    >
      {/* User Line Skeleton */}
      <MotiView style={styles.userLineContainer}>
        <Skeleton height={50} width={50} radius={25} />
        <MotiView style={styles.userInfo}>
          <Skeleton width={150} height={15} radius={4} />
          <Spacer />
          <Skeleton width={100} height={15} radius={4} />
          <Spacer />
          <Skeleton width={200} height={15} radius={4} />
        </MotiView>
      </MotiView>

      {/* Blurred Post Front View Skeleton */}
      <Skeleton width="100%" height={width} radius={8} />
      <Spacer />
    </MotiView>
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
