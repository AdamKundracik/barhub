import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import RequestPhotoButton from './RequestPhotoButton';
import { Post, User } from '../../../../../shared';
import { PlacePrediction } from '../../../utils/types/types';
import UserPost from './Post/UserPost';
import Ad from '../Ad';
import { useUserContext } from '../../../providers/UserProvider';
import {
  iconInactiveColor,
  primaryColor,
  primaryGrey,
  primaryLightGrey,
  warningColor,
} from '../../../utils/styles/colors';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import LoadingIndicator from './LoadingIndicator';
import PostOldInfo from './Post/PostOldInfo';
import { isOlderThanMinutes } from '../../../utils/helper-functions/isOlderThanMinutes';

interface PostsListProps {
  posts: Post[];
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: User | null | undefined;
  numberOfDaysSinceLastPostedPhoto: number;
  placeId: string | null;
  requestPhoto: () => void;
  fetchMorePosts: () => Promise<void>;
  onRefresh: () => Promise<void>;
  loading: boolean;
  isFiltering: boolean;
  isFetchingNextPage: boolean;
  onCommentPress: (postId: string) => void;
}

const PostsList = ({
  posts,
  zoomedPost,
  setZoomedPost,
  userData,
  numberOfDaysSinceLastPostedPhoto,
  placeId,
  requestPhoto,
  fetchMorePosts,
  onRefresh,
  loading,
  isFiltering,
  onCommentPress,
  isFetchingNextPage,
}: PostsListProps) => {
  const { users } = useUserContext();

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
        <RefreshControl refreshing={loading} onRefresh={onRefresh ?? loading} />
      }
      onEndReached={fetchMorePosts}
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
