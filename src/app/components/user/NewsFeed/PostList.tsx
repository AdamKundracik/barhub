import React, { useCallback, useMemo, useRef, useEffect } from 'react';
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
import { simpleAdMetrics } from '@/src/app/utils/simpleAdMetrics';
import { usePostsStore } from '@/src/app/utils/store/postStore';

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
  const listRef = useRef<FlashListRef<Post> | null>(null);

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

  // Memoize posts length to prevent renderItem recreation
  const postsLength = posts.length;

  const ListHeader = useCallback(() => {
    if (!placeId || posts.length === 0) return null;
    if (!isOlderThanMinutes(posts[0].creationTime, 30)) return null;
    return <PostOldInfo requestPhoto={requestPhoto} />;
  }, [placeId, posts.length, posts[0]?.creationTime, requestPhoto]);

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      const postView = (
        <View style={{ marginVertical: 10 }}>
          <UserPost
            requestPhoto={requestPhoto}
            onCommentPress={onCommentPress}
            isFiltering={isFiltering}
            hasPremium={hasPremium}
            post={item}
            setZoomedPost={setZoomedPost}
            isZoomed={zoomedPost === item.photoUrl}
          />
        </View>
      );

      // Production-optimized ad positioning
      const shouldShowAd = (() => {
        // Check if ads are enabled
        if (!PremiumHelpers.shouldAlwaysShowAds()) {
          return false;
        }

        const config = getFrequencyConfig();
        const totalPosts = postsLength;

        // Skip first post for better UX
        if (index < config.MIN_POSTS_FOR_ADS) {
          return false;
        }

        // Skip last post
        if (index >= totalPosts - 1) {
          return false;
        }

        // Adaptive frequency based on feed size and performance
        let frequency = config.BASE_FREQUENCY;

        if (totalPosts < 5) {
          // For very small feeds, show one ad in the middle
          return index === Math.floor(totalPosts / 2);
        }

        // Reduce frequency if ads are failing too often
        if (simpleAdMetrics.shouldReduceFrequency()) {
          frequency = Math.min(5, frequency + 1); // Less frequent if failing
        } else if (totalPosts > 20) {
          // More frequent in long feeds for better revenue (only if ads are working)
          frequency = Math.max(2, frequency - 1);
        }

        // Primary ad positions
        return index % frequency === 0;
      })();

      if (shouldShowAd) {
        return (
          <View key={`ad-${index}`}>
            <InlineAd />
            {postView}
          </View>
        );
      }

      return postView;
    },
    [
      hasPremium,
      requestPhoto,
      onCommentPress,
      isFiltering,
      setZoomedPost,
      postsLength,
      zoomedPost,
    ]
  );

  // Optimize item type for better recycling
  const getItemType = useCallback(
    (item: Post, index: number) => {
      const shouldShowAd = (() => {
        if (!PremiumHelpers.shouldAlwaysShowAds()) {
          return false;
        }
        const config = getFrequencyConfig();
        const totalPosts = postsLength;
        if (index < config.MIN_POSTS_FOR_ADS || index >= totalPosts - 1) {
          return false;
        }
        let frequency = config.BASE_FREQUENCY;
        if (totalPosts < 5) {
          return index === Math.floor(totalPosts / 2);
        }
        if (simpleAdMetrics.shouldReduceFrequency()) {
          frequency = Math.min(5, frequency + 1);
        } else if (totalPosts > 20) {
          frequency = Math.max(2, frequency - 1);
        }
        return index % frequency === 0;
      })();

      return shouldShowAd ? 'postWithAd' : 'post';
    },
    [postsLength]
  );

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
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
