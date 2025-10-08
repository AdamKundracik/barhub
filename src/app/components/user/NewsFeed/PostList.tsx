import React, { useCallback, useEffect, useRef } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import UserPost from './Post/UserPost';
import LoadingIndicator from './LoadingIndicator';
import PostOldInfo from './Post/PostOldInfo';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { primaryColor } from '../../../utils/styles/colors';
import { useTranslation } from 'react-i18next';
import NativeAdComponent from '@/src/app/components/user/NativeAd';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { usePostsStore } from '@/src/app/utils/store/postStore';
import { Post } from '@/common/types/postTypes';
import { User } from '@/shared';
import { FlashList, FlashListRef } from '@shopify/flash-list';

interface PostsListProps {
  posts: Post[];
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: User | null | undefined;
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
  requestPhoto,
  fetchMorePosts,
  onRefresh,
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
  }, [flatListRef]);

  // const handleScroll = (event: any) => {
  //   const scrollPosition = event.nativeEvent.contentOffset.y;
  //   const shouldShow = scrollPosition > 300;
  //
  //   if (shouldShow !== showScrollTopButton) {
  //     setShowScrollTopButton(shouldShow);
  //     Animated.spring(scrollButtonAnimation, {
  //       toValue: shouldShow ? 1 : 0,
  //       useNativeDriver: true,
  //     }).start();
  //   }
  // };

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

  // const scrollToTop = () => {
  //   flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  // };

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

  // ✅ Memoizovaný renderItem
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

      if (index > 0 && index % 3 === 0 && !isPremium()) {
        return (
          <>
            <NativeAdComponent />
            {postView}
          </>
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
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            hasMorePosts={hasMorePosts}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
        onEndReached={hasMorePosts ? fetchMorePosts : null}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {placeId && posts.length > 0 && isOlderThanMinutes(posts[0].creationTime, 30) && (
              <PostOldInfo requestPhoto={requestPhoto} />
            )}
          </>
        }
      />
      {/*SCROLL TO TOP BUTTON*/}
      {/*<Animated.View*/}
      {/*  style={[*/}
      {/*    styles.scrollTopButton,*/}
      {/*    {*/}
      {/*      transform: [*/}
      {/*        {*/}
      {/*          scale: scrollButtonAnimation.interpolate({*/}
      {/*            inputRange: [0, 1],*/}
      {/*            outputRange: [0, 1],*/}
      {/*          }),*/}
      {/*        },*/}
      {/*      ],*/}
      {/*      opacity: scrollButtonAnimation,*/}
      {/*    },*/}
      {/*  ]}*/}
      {/*>*/}
      {/*  <TouchableOpacity*/}
      {/*    onPress={scrollToTop}*/}
      {/*    style={styles.scrollTopButtonTouchable}*/}
      {/*  >*/}
      {/*    <FontAwesomeIcon icon={Icons.Up} size={20} color="black" />*/}
      {/*  </TouchableOpacity>*/}
      {/*</Animated.View>*/}
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
