import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import PostsList from '../../../components/user/NewsFeed/PostList';
import PostLoaderView from '../../../components/user/NewsFeed/Post/Loaders/PostLoaderView';
import EmptyState from '../../../components/user/NewsFeed/EmptyState';
import InlineAd from '@/src/app/components/user/InlineAd';
import { useUserStore } from '@/src/app/utils/store/userStore';

interface FeedContentProps {
  isLoading: boolean;
  posts: any[];
  isRefetching: boolean;
  onRefresh: () => Promise<void>;
  // Post list props
  hasNextPage?: boolean;
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: any;
  daysSinceLastUpload: number;
  requestPhoto: () => Promise<void>;
  onCommentPress: (postId: string, token: string, userId: string) => void;
  isFiltering: boolean;
  isFetchingNextPage: boolean;
  fetchMorePosts: () => Promise<void>;
}

export const FeedContent: React.FC<FeedContentProps> = ({
  isLoading,
  posts,
  isRefetching,
  onRefresh,
  hasNextPage,
  zoomedPost,
  setZoomedPost,
  userData,
  daysSinceLastUpload,
  requestPhoto,
  onCommentPress,
  isFiltering,
  isFetchingNextPage,
  fetchMorePosts,
}) => {
  const { premium } = useUserStore();

  if (isLoading) {
    return <PostLoaderView />;
  }

  if (posts?.length > 0) {
    return (
      <PostsList
        hasMorePosts={hasNextPage}
        posts={posts}
        zoomedPost={zoomedPost}
        setZoomedPost={setZoomedPost}
        userData={userData}
        numberOfDaysSinceLastPostedPhoto={daysSinceLastUpload}
        requestPhoto={requestPhoto}
        onCommentPress={onCommentPress}
        isFiltering={isFiltering}
        onRefresh={onRefresh}
        loading={isRefetching}
        isFetchingNextPage={isFetchingNextPage}
        fetchMorePosts={fetchMorePosts}
      />
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        <EmptyState requestPhoto={requestPhoto} />
        {!premium && (
          <View style={{ paddingVertical: 8 }}>
            <InlineAd />
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
