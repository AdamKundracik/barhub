import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import RequestPhotoButton from './RequestPhotoButton';
import { Post, User } from '../../../../../shared';
import { PlacePrediction } from '../../../utils/types/types';
import UserPost from './Post/UserPost';
import Ad from '../Ad';

interface PostsListProps {
  posts: Post[];
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: User | null | undefined;
  numberOfDaysSinceLastPostedPhoto: number;
  place: PlacePrediction | null;
  requestPhoto: () => void;
  fetchMorePosts: () => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
  isFiltering: boolean;
}

const PostsList: React.FC<PostsListProps> = ({
  posts,
  zoomedPost,
  setZoomedPost,
  userData,
  numberOfDaysSinceLastPostedPhoto,
  place,
  requestPhoto,
  fetchMorePosts,
  onRefresh,
  loading,
  isFiltering,
}) => {
  const renderPostItem = ({ item, index }: { item: Post; index: number }) => (
    <View
      key={item.id} // Use `id` if available to avoid index-based keys.
      style={{
        marginVertical: 10,
        zIndex: zoomedPost === item.photoUrl ? 1 : 0,
      }}
    >
      <UserPost
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
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      onEndReached={fetchMorePosts}
      onEndReachedThreshold={0} // Trigger when the user scrolls close to the end
      ListHeaderComponent={
        place && <RequestPhotoButton requestPhoto={requestPhoto} />
      }
    />
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
  },
});

export default PostsList;
