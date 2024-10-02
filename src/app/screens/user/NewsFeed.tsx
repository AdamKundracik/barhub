import React, { useEffect, useState } from 'react';
import Layout from '../../components/user/Shared/Layout';
import { useInfiniteQuery } from 'react-query';
import {
  NavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { handleFreshContent } from '../../utils/helper-functions/posts-functions';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
import { PlaceDetail, PlaceDetailsResponse } from '../../utils/types/types';
import NotificationHandler from '../../components/user/NewsFeed/NotificationHandler';
import LoadingIndicator from '../../components/user/NewsFeed/LoadingIndicator';
import PostsList from '../../components/user/NewsFeed/PostList';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { sendNotificationHandler } from '../../utils/helper-functions/sendNotificationHandler';
import { sendPushNotification } from '../../utils/services/notofications-handler';
import FeedHeader from '../../components/user/NewsFeed/FeedHeader';
import CommentsSlider from '../../components/user/NewsFeed/Post/CommentsSlider';
import { usePlaceStore } from '../../utils/store/placesStore';
import EmptyState from '../../components/user/NewsFeed/EmptyState';
import { usePostsStore } from '../../utils/store/postStore';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { formStyles } from '../../utils/styles/styles';

export const NewsFeed = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { userData } = useUserContext();
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const { users } = useUserContext();
  const { t } = useTranslation();

  const { placeId, placeName, placeDetail, setPlaceDetail } = usePlaceStore();
  const { posts, setPosts, setRefetchPosts } = usePostsStore();

  // Set up state for days since the last uploaded post
  const [
    numberOfDaysSinceLastPostedPhoto,
    setNumberOfDaysSinceLastPostedPhoto,
  ] = useState(0);

  useEffect(() => {
    const numberOfDays = getDaysSince(
      userData?.lastUploadedPost ?? new Date().toISOString()
    );
    setNumberOfDaysSinceLastPostedPhoto(numberOfDays);
  }, [userData]);

  const {
    data: postsData,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    placeId ? ['posts', placeId] : 'posts',
    ({ pageParam = null }) => handleFreshContent(pageParam, placeId), // Handle fresh content when place is not set
    {
      getNextPageParam: lastPage => lastPage?.lastVisible || null, // Fetch more posts based on lastVisible (cursor)
      staleTime: Infinity, // Keep data fresh for 10 minutes
    }
  );

  useEffect(() => {
    if (placeId) refetch(); // Manually trigger refetch when placeId changes
  }, [placeId]);

  // Manual refresh function
  const onRefresh = async () => {
    await refetch();
  };

  // Function to fetch more posts for pagination
  const fetchMorePosts = async () => {
    if (hasNextPage) {
      await fetchNextPage(); // Load more posts when at the bottom of the list
    }
  };

  async function requestPhoto() {
    const senderToken = userData?.pushToken;
    const detail: PlaceDetail = await fetchPlaceDetails(placeId ?? '');
    setPlaceDetail(detail);
    if (placeId && placeName && detail) {
      const tokens = await sendNotificationHandler({
        latitude: detail?.geometry.location?.lat,
        longitude: detail?.geometry.location?.lng,
      });

      tokens?.forEach(token => {
        sendPushNotification(token, placeId, placeName, senderToken ?? '');
      });
    }
  }

  async function toggleComments(postId: string) {
    setPostId(postId);
    setShowComments(true);
  }

  return (
    <Layout pageTitle={t('feed')}>
      <FeedHeader placeName={placeName} />
      <NotificationHandler navigation={navigation} userData={userData} />

      {isLoading ? (
        <LoadingIndicator />
      ) : postsData?.pages.flatMap(page => page.posts).length ? (
        <PostsList
          hasMorePosts={hasNextPage}
          posts={postsData.pages.flatMap(page => page.posts)}
          zoomedPost={zoomedPost}
          setZoomedPost={setZoomedPost}
          userData={userData}
          numberOfDaysSinceLastPostedPhoto={numberOfDaysSinceLastPostedPhoto}
          requestPhoto={requestPhoto}
          onCommentPress={toggleComments}
          isFiltering={!!placeId}
          onRefresh={onRefresh}
          loading={isRefetching}
          isFetchingNextPage={isFetchingNextPage}
          fetchMorePosts={fetchMorePosts} // Pagination function passed here
        />
      ) : (
        <>
          {isRefetching && <LoadingIndicator />}
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
            }
          >
            <EmptyState requestPhoto={requestPhoto} />
          </ScrollView>
        </>
      )}

      {showComments && (
        <CommentsSlider
          users={users}
          postId={postId}
          closeComments={() => setShowComments(false)}
        />
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center', // Center content vertically in ScrollView
    alignItems: 'center', // Center content horizontally
  },
});

export default NewsFeed;
