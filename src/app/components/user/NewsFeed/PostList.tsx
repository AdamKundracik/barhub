import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Post, User } from '../../../../../shared';
import UserPost from './Post/UserPost';
import LoadingIndicator from './LoadingIndicator';
import PostOldInfo from './Post/PostOldInfo';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { primaryColor } from '../../../utils/styles/colors';
import { useUserContext } from '../../../providers/UserProvider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { FirebaseTimestamp } from '../../../utils/types/types';

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
  onCommentPress: (
    postId: string,
    expoPushToken: string,
    userId: string
  ) => void;
  hasMorePosts: boolean | undefined;
}

const PostsList = ({
  posts,
  zoomedPost,
  setZoomedPost,
  userData,
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
  const flatListRef = useRef<FlatList>(null);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  const scrollButtonAnimation = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollPosition > 300;

    if (shouldShow !== showScrollTopButton) {
      setShowScrollTopButton(shouldShow);
      Animated.spring(scrollButtonAnimation, {
        toValue: shouldShow ? 1 : 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const isOlderThanMinutes = (
    timestamp: FirebaseTimestamp,
    minutes: number
  ): boolean => {
    const seconds = timestamp.seconds || timestamp._seconds || 0;
    const now = Date.now();
    const timestampMs = seconds * 1000;
    const minutesInMs = minutes * 60 * 1000;

    return now - timestampMs > minutesInMs;
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderPostItem = ({ item }: { item: Post; index: number }) => (
    <View
      key={item.id}
      style={{
        marginVertical: 10,
        zIndex: zoomedPost === item.photoUrl ? 1 : 0,
      }}
    >
      <UserPost
        requestPhoto={requestPhoto}
        user={users?.find(user => user.uid === item.userId)}
        onCommentPress={(postId, expoPushToken, userId) =>
          onCommentPress(postId, expoPushToken, userId)
        }
        isFiltering={isFiltering}
        hasPremium={userData?.premium ?? false}
        post={item}
        setZoomedPost={setZoomedPost}
        isZoomed={zoomedPost === item.photoUrl}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scrollView}
        ListFooterComponent={isFetchingNextPage ? <LoadingIndicator /> : null}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        onEndReached={hasMorePosts ? fetchMorePosts : null}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        ListHeaderComponent={
          <>
            {loading && <LoadingIndicator />}
            {placeId && isOlderThanMinutes(posts[0].creationTime, 30) && (
              <PostOldInfo requestPhoto={requestPhoto} />
            )}
          </>
        }
      />

      <Animated.View
        style={[
          styles.scrollTopButton,
          {
            transform: [
              {
                scale: scrollButtonAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
            opacity: scrollButtonAnimation,
          },
        ]}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          style={styles.scrollTopButtonTouchable}
        >
          <FontAwesomeIcon icon={Icons.Up} size={20} color="black" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: primaryColor,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollTopButtonTouchable: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostsList;
