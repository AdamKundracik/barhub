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
import { PlaceDetailsResponse } from '../../utils/types/types';
import NotificationHandler from '../../components/user/NewsFeed/NotificationHandler';
import LoadingIndicator from '../../components/user/NewsFeed/LoadingIndicator';
import PostsList from '../../components/user/NewsFeed/PostList';
import EmptyState from '../../components/user/NewsFeed/EmptyState';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { sendNotificationHandler } from '../../utils/helper-functions/sendNotificationHandler';
import { sendPushNotification } from '../../utils/services/notofications-handler';
import FeedHeader from '../../components/user/NewsFeed/FeedHeader';
import CommentsSlider from '../../components/user/NewsFeed/Post/CommentsSlider';

export const NewsFeed: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { userData } = useUserContext();
  const route = useRoute();

  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const routeParams = route.params as {
    selectedPlaceId?: string;
    selectedPlaceName: string;
  }; // Define route params
  const [postId, setPostId] = useState<string | null>(null);
  const { users } = useUserContext();
  const { t } = useTranslation();
  const [placeDetial, setPlaceDetial] = useState<PlaceDetailsResponse | null>(
    null
  );

  // Set up state for days since the last uploaded post
  const [
    numberOfDaysSinceLastPostedPhoto,
    setNumberOfDaysSinceLastPostedPhoto,
  ] = useState(0);

  useEffect(() => {
    if (routeParams?.selectedPlaceId && routeParams.selectedPlaceName) {
      setPlaceId(routeParams.selectedPlaceId); // Set the place when passed from PlaceSearch
      setPlaceName(routeParams.selectedPlaceName);
      fetchPlaceDetail(routeParams.selectedPlaceId);
    }
  }, [routeParams?.selectedPlaceId, routeParams?.selectedPlaceName]);

  async function fetchPlaceDetail(id: string) {
    const detail: PlaceDetailsResponse = await fetchPlaceDetails(id);
    setPlaceDetial(detail);
  }

  useEffect(() => {
    const numberOfDays = getDaysSince(
      userData?.lastUploadedPost ?? new Date().toISOString()
    );
    setNumberOfDaysSinceLastPostedPhoto(numberOfDays);
  }, [userData]);

  // Fetch posts using React Query
  const {
    data: postsData,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    ['posts', placeId], // Key for the query
    ({ pageParam = null }) => handleFreshContent(pageParam, placeId), // Handle fresh content when place is not set
    {
      getNextPageParam: lastPage => lastPage?.lastVisible || null, // Fetch more posts based on lastVisible (cursor)
      staleTime: 10 * 60 * 1000, // Keep data fresh for 10 minutes
      cacheTime: 15 * 60 * 1000, // Cache data for 15 minutes
      refetchInterval: 4 * 60 * 1000,
      enabled: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: false,
    }
  );

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
    if (placeId && placeDetial) {
      const tokens = await sendNotificationHandler({
        latitude: placeDetial?.result.geometry.location?.lat,
        longitude: placeDetial?.result.geometry.location?.lng,
      });
      tokens.forEach(token => {
        sendPushNotification(token, placeId, senderToken ?? '');
      });
    }
  }

  async function toggleComments(postId: string) {
    setPostId(postId);
    setShowComments(true);
  }

  return (
    <Layout pageTitle={t('feed')}>
      <FeedHeader
        placeName={placeName}
        setPlaceName={setPlaceName}
        setPlaceId={setPlaceId}
      />
      <NotificationHandler navigation={navigation} userData={userData} />

      {isLoading ? (
        <LoadingIndicator />
      ) : postsData?.pages.flatMap(page => page.posts).length ? (
        <PostsList
          posts={postsData.pages.flatMap(page => page.posts)}
          zoomedPost={zoomedPost}
          setZoomedPost={setZoomedPost}
          userData={userData}
          placeId={placeId}
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
        <EmptyState placeId={placeId} requestPhoto={requestPhoto} />
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

export default NewsFeed;
