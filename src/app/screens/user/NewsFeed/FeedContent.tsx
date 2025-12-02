import React from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import PostsList from '../../../components/user/NewsFeed/PostList';
import PostLoaderView from '../../../components/user/NewsFeed/Post/Loaders/PostLoaderView';
import EmptyState from '../../../components/user/NewsFeed/EmptyState';
import LocationRequiredState from '../../../components/user/NewsFeed/LocationRequiredState';
import { primaryColor } from '../../../utils/styles/colors';
import { usePermissionsContext } from '../../../providers/PermissionsProvider';

interface FeedContentProps {
  isLoading: boolean;
  posts: any[];
  isRefetching: boolean;
  onRefresh: () => Promise<void>;
  onForceRefresh?: () => Promise<void>;
  // Post list props
  hasNextPage?: boolean;
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: any;
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
  onForceRefresh,
  hasNextPage,
  zoomedPost,
  setZoomedPost,
  userData,
  requestPhoto,
  onCommentPress,
  isFiltering,
  isFetchingNextPage,
  fetchMorePosts,
}) => {
  const { permissions } = usePermissionsContext();

  // Debug log
  console.log('[FeedContent] Current permissions:', permissions);
  console.log('[FeedContent] Has geolocation:', permissions.geolocation);
  console.log('[FeedContent] Posts count:', posts?.length);

  if (isLoading) {
    return <PostLoaderView />;
  }

  // If no location permission, show location required state
  if (!permissions.geolocation) {
    console.log('[FeedContent] Showing LocationRequiredState');
    return (
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        <LocationRequiredState requestPhoto={requestPhoto} />
      </ScrollView>
    );
  }

  // If we have location permission and posts, show the list
  if (posts?.length > 0) {
    console.log('[FeedContent] Showing PostsList');
    return (
      <PostsList
        hasMorePosts={hasNextPage}
        posts={posts}
        zoomedPost={zoomedPost}
        setZoomedPost={setZoomedPost}
        userData={userData}
        requestPhoto={requestPhoto}
        onCommentPress={onCommentPress}
        isFiltering={isFiltering}
        onRefresh={onRefresh}
        onForceRefresh={onForceRefresh}
        loading={isRefetching}
        isFetchingNextPage={isFetchingNextPage}
        fetchMorePosts={fetchMorePosts}
      />
    );
  }

  // If we have location permission but no posts, show empty state
  console.log('[FeedContent] Showing EmptyState');
  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={primaryColor}
          colors={[primaryColor]}
        />
      }
    >
      <EmptyState requestPhoto={requestPhoto} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineAdContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
});
