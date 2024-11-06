import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiScrollView, MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';

const Spacer = ({ height = 8 }) => <MotiView style={{ height }} />;

const CommentsLoaderView = () => (
  <MotiScrollView>
    {Array.from({ length: 8 }).map((_, index) => (
      <MotiView key={index} style={styles.commentItemContainer}>
        <MotiView style={styles.userLineContainer}>
          <Skeleton width={32} height={32} radius={16} />
          {/* Comment Content Skeleton */}
          <View style={styles.commentContentContainer}>
            <Skeleton width={120} height={10} radius={4} />
            <Spacer />
            <Skeleton width={'90%'} height={10} radius={4} />
          </View>
        </MotiView>
      </MotiView>
    ))}
  </MotiScrollView>
);

const styles = StyleSheet.create({
  commentItemContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  userLineContainer: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profilePicture: {
    marginRight: 10,
  },
  commentContentContainer: {
    flex: 1,
  },
  displayName: {
    marginBottom: 5,
  },
  commentText: {
    marginBottom: 5,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 42,
  },
});

export default CommentsLoaderView;
