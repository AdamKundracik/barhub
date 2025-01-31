import { MotiScrollView, MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { StyleSheet } from 'react-native';

const TextSpacer = ({ height = 4 }) => <MotiView style={{ height }} />;

export const NotificationLoaderView = () => {
  return (
    <MotiScrollView>
      {Array.from({ length: 4 }).map((_, index) => (
        <MotiView
          key={index}
          transition={{
            type: 'timing',
          }}
          style={styles.notificationContainer}
        >
          <MotiView style={styles.contentRow}>
            <MotiView style={styles.iconContainer}>
              <Skeleton height={20} width={20} radius={10} />
            </MotiView>

            <MotiView style={styles.textContainer}>
              <Skeleton width={100} height={14} radius={4} />
              <TextSpacer />
              <Skeleton width={250} height={14} radius={4} />
              <TextSpacer />
              <Skeleton width={80} height={12} radius={4} />
            </MotiView>
          </MotiView>
        </MotiView>
      ))}
    </MotiScrollView>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    alignSelf: 'center',
  },
  textContainer: {
    flex: 1,
  },
});

export default NotificationLoaderView;
