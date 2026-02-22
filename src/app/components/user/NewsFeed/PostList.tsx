import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import UserPost from './Post/UserPost';
import LoadingIndicator from './LoadingIndicator';
import PostOldInfo from './Post/PostOldInfo';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { primaryColor } from '../../../utils/styles/colors';
import { useTranslation } from 'react-i18next';
import InlineAd from '@/src/app/components/user/InlineAd';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { Post } from '@/src/app/types/postTypes';
import { User } from '@/shared';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';
import { getFrequencyConfig } from '@/src/app/config/productionAdConfig';
import { usePostsStore } from '@/src/app/utils/store/postStore';

type FeedItem = { type: 'post'; post: Post } | { type: 'ad'; id: string };

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
  const { setListRef } = usePostsStore();
  const listRef = useRef<FlashListRef<FeedItem> | null>(null);

  // Register the FlashList ref in the store for scroll-to-top functionality
  useEffect(() => {
    setListRef(listRef);
    return () => setListRef(null);
  }, [setListRef]);

  // Memoize premium status to prevent recalculation on each render
  const hasPremium = useMemo(() => isPremium(), [isPremium]);

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

  const ListFooter = useCallback(
    ({
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
    },
    [t]
  );

  // Vygeneruj stabilný zoznam itemov (posty + reklamy), aby sa pozície reklám
  // po dotiahnutí ďalších strán nemenili v existujúcej časti feedu.
  const feedItems: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    const adsEnabled = PremiumHelpers.shouldAlwaysShowAds();
    const baseFrequency = getFrequencyConfig().BASE_FREQUENCY; // napr. 3,4,5...

    posts.forEach((post, index) => {
      const totalPostsSoFar = index + 1;

      // Vždy pridaj post
      items.push({ type: 'post', post });

      // Reklamu vlož až ZA post, a len podľa prefixu (totalPostsSoFar),
      // aby sa už vložené reklamy pri ďalšom načítaní nemenili.
      if (
        adsEnabled &&
        totalPostsSoFar >= baseFrequency &&
        totalPostsSoFar % baseFrequency === 0
      ) {
        items.push({ type: 'ad', id: `ad-${totalPostsSoFar}` });
      }
    });

    return items;
  }, [posts]);

  const ListHeader = useCallback(() => {
    if (!placeId || posts.length === 0) return null;
    if (!isOlderThanMinutes(posts[0].creationTime, 30)) return null;
    return <PostOldInfo requestPhoto={requestPhoto} />;
  }, [placeId, posts.length, posts[0]?.creationTime, requestPhoto]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem; index: number }) => {
      if (item.type === 'ad') {
        return (
          <View style={{ marginVertical: 10 }}>
            <InlineAd />
          </View>
        );
      }

      const post = item.post;

      return (
        <View style={{ marginVertical: 10 }}>
          <UserPost
            requestPhoto={requestPhoto}
            onCommentPress={onCommentPress}
            isFiltering={isFiltering}
            hasPremium={hasPremium}
            post={post}
            setZoomedPost={setZoomedPost}
            isZoomed={zoomedPost === post.photoUrl}
          />
        </View>
      );
    },
    [
      hasPremium,
      requestPhoto,
      onCommentPress,
      isFiltering,
      setZoomedPost,
      zoomedPost,
    ]
  );

  // Typ itemu – rozlišujeme post a reklamu kvôli recyklácii, ale pozície reklám sú stabilné.
  const getItemType = useCallback((item: FeedItem) => item.type, []);

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={item => (item.type === 'ad' ? item.id : item.post.id)}
        getItemType={getItemType}
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={826}
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
        ListHeaderComponent={ListHeader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    paddingBottom: 80,
  },
});

export default React.memo(PostsList);
