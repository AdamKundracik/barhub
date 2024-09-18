import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Post, User } from '../../../../../shared';
import UserPost from './Post/UserPost';
import Ad from '../Ad';
import { useUserContext } from '../../../providers/UserProvider';
import { primaryLightGrey, warningColor } from '../../../utils/styles/colors';
import LoadingIndicator from './LoadingIndicator';
import PostOldInfo from './Post/PostOldInfo';
import { isOlderThanMinutes } from '../../../utils/helper-functions/isOlderThanMinutes';
import { usePlaceStore } from '../../../utils/store/placesStore';

interface PostsListProps {
  posts: Post[];
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: User | null | undefined;
  numberOfDaysSinceLastPostedPhoto: number;
  requestPhoto: () => void;
  fetchMorePosts: () => Promise<void>;
  onRefresh: () => Promise<void>;
  loading: boolean;
  isFiltering: boolean;
  isFetchingNextPage: boolean;
  onCommentPress: (postId: string) => void;
  hasMorePosts: boolean | undefined;
}

const PostsList = ({
  posts,
  zoomedPost,
  setZoomedPost,
  userData,
  numberOfDaysSinceLastPostedPhoto,
  requestPhoto,
  fetchMorePosts,
  onRefresh,
  loading,
  isFiltering,
  onCommentPress,
  isFetchingNextPage,
  hasMorePosts,
}: PostsListProps) => {
  const { users } = useUserContext();
  const { placeId } = usePlaceStore();

  const renderPostItem = ({ item, index }: { item: Post; index: number }) => (
    <View
      key={item.id} // Use `id` if available to avoid index-based keys.
      style={{
        marginVertical: 10,
        zIndex: zoomedPost === item.photoUrl ? 1 : 0,
      }}
    >
      <UserPost
        requestPhoto={requestPhoto}
        user={users?.find(user => user.uid === item.user_id)}
        onCommentPress={postId => onCommentPress(postId)}
        isFiltering={isFiltering}
        hasPremium={
          (userData?.premium || numberOfDaysSinceLastPostedPhoto <= 7) ?? false
        }
        post={item}
        setZoomedPost={setZoomedPost}
        isZoomed={zoomedPost === item.photoUrl}
      />
      {index % 2 === 0 && index !== 0 && <Ad />}
    </View>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderPostItem}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.scrollView}
      ListFooterComponent={isFetchingNextPage ? <LoadingIndicator /> : null} // Show loading indicator when fetching more
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      onEndReached={hasMorePosts ? fetchMorePosts : null}
      onEndReachedThreshold={0.5} // Trigger when the user scrolls close to the end
      ListHeaderComponent={
        <>
          {loading && <LoadingIndicator />}
          {placeId && isOlderThanMinutes(posts[0].creationTime, 30) && (
            <PostOldInfo requestPhoto={requestPhoto} />
          )}
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
  },
  text: {
    marginBottom: 15,
    textAlign: 'center',
    color: primaryLightGrey,
  },
  buttonContainer: {
    alignSelf: 'center',
  },
  button: {
    width: 180,
    borderRadius: 30,
    borderColor: warningColor,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    width: 180,
    borderRadius: 30,
    backgroundColor: warningColor,
    borderColor: warningColor,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostsList;
