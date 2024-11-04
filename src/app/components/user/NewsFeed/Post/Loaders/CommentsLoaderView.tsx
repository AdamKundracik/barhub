import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';

const Spacer = ({ height = 8 }) => <MotiView style={{ height }} />;

const CommentsLoaderView = () => (
  <MotiView>
    <MotiView style={styles.commentItemContainer}>
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

    <MotiView style={styles.commentItemContainer}>
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

    <MotiView style={styles.commentItemContainer}>
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

    <MotiView style={styles.commentItemContainer}>
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
  </MotiView>
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
