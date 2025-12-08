import React, { useCallback, useEffect, useRef } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import UserPost from './Post/UserPost';
import LoadingIndicator from './LoadingIndicator';
import PostOldInfo from './Post/PostOldInfo';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { primaryColor } from '../../../utils/styles/colors';
import { useTranslation } from 'react-i18next';
import InlineAd from '@/src/app/components/user/InlineAd';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { usePostsStore } from '@/src/app/utils/store/postStore';
import { Post } from '@/src/app/types/postTypes';
import { User } from '@/shared';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';

interface PostsListProps {
  posts: Post[];
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: User | null | undefined;
  requestPhoto: () => void;
  fetchMorePosts: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onForceRefresh?: () => Promise<void>;
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
  requestPhoto,
  fetchMorePosts,
  onRefresh,
  onForceRefresh,
  loading,
  isFiltering,
  onCommentPress,
  isFetchingNextPage,
  hasMorePosts,
}: PostsListProps) => {
  const { t } = useTranslation();
  const { placeId } = usePlaceStore();
  const { isPremium } = useUserStore();
  const flatListRef = useRef<FlashListRef<any>>(null);
  // const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  // const scrollButtonAnimation = useRef(new Animated.Value(0)).current;
  const { setListRef } = usePostsStore();

  useEffect(() => {
    if (flatListRef) {
      setListRef(flatListRef);
    }
  }, [setListRef]);

  const isOlderThanMinutes = (
    date: Date | string | number | any,
    minutes: number
  ): boolean => {
    if (!date) return false;

    let timestampMs: number;

    // Handle Date object (from BE LocalDateTime via mapper)
    if (date instanceof Date) {
      timestampMs = date.getTime();
    }
    // Handle string (ISO format) or number (timestamp)
    else if (typeof date === 'string' || typeof date === 'number') {
      timestampMs = new Date(date).getTime();
    }
    // Handle serialized Date from React Query cache
    else if (typeof date === 'object' && date.time) {
      timestampMs = date.time;
    }
    // Fallback
    else {
      return false;
    }

    const now = Date.now();
    const minutesInMs = minutes * 60 * 1000;

    return now - timestampMs > minutesInMs;
  };

  const ListFooter = ({
    isFetchingNextPage,
    hasMorePosts,
  }: {
    isFetchingNextPage: boolean;
    hasMorePosts?: boolean;
  }) => {
    if (isFetchingNextPage) return <LoadingIndicator />;
    if (!hasMorePosts)
      return (
        <Text style={{ textAlign: 'center', padding: 16, color: 'gray' }}>
          {t('thats-it')}👋
        </Text>
      );
    return null;
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      const postView = (
        <View
          style={{
            marginVertical: 10,
            zIndex: zoomedPost === item.photoUrl ? 1 : 0,
          }}
        >
          <UserPost
            requestPhoto={requestPhoto}
            onCommentPress={(postId, expoPushToken, userId) =>
              onCommentPress(postId, expoPushToken, userId)
            }
            isFiltering={isFiltering}
            hasPremium={isPremium()}
            post={item}
            setZoomedPost={setZoomedPost}
            isZoomed={zoomedPost === item.photoUrl}
          />
        </View>
      );

      // Show ad every 2 posts (but not on first post)
      // Check config: if ALWAYS_SHOW_ADS is true, ignore premium status
      // Rate limiting is handled inside InlineAd component
      const shouldShowAd =
        index > 0 && index % 2 === 0 && PremiumHelpers.shouldAlwaysShowAds();

      if (shouldShowAd) {
        return (
          <View>
            <InlineAd />
            {postView}
          </View>
        );
      }

      return postView;
    },
    [
      zoomedPost,
      isPremium,
      requestPhoto,
      onCommentPress,
      isFiltering,
      setZoomedPost,
    ]
  );

  return (
    <View style={styles.container}>
      <FlashList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scrollView}
        drawDistance={500} // Reduce overdraw for better performance
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            hasMorePosts={hasMorePosts}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onForceRefresh || onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
        onEndReached={hasMorePosts ? fetchMorePosts : null}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {placeId &&
              posts.length > 0 &&
              isOlderThanMinutes(posts[0].creationTime, 30) && (
                <PostOldInfo requestPhoto={requestPhoto} />
              )}
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 80,
  },
});

export default PostsList;
