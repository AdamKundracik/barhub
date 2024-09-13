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
import {
  handleFreshContent,
  handlePlacePosts,
} from '../../utils/helper-functions/posts-functions';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
import { PlaceDetailsResponse, PlacePrediction } from '../../utils/types/types';
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
  const [place, setPlace] = useState<PlacePrediction | null>(null);
  const [showComments, setShowComments] = useState(false);
  const routeParams = route.params as { selectedPlace?: PlacePrediction }; // Define route params
  const [postId, setPostId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const { users } = useUserContext();
  const { t } = useTranslation();

  // Set up state for days since the last uploaded post
  const [
    numberOfDaysSinceLastPostedPhoto,
    setNumberOfDaysSinceLastPostedPhoto,
  ] = useState(0);

  useEffect(() => {
    if (routeParams?.selectedPlace) {
      setPlace(routeParams.selectedPlace); // Set the place when passed from PlaceSearch
    }
  }, [routeParams?.selectedPlace]);

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
    ['posts', place?.placeId], // Key for the query
    ({ pageParam = null }) =>
      place
        ? handlePlacePosts(place.placeId, pageParam) // Pass the pageParam (lastVisible) for pagination
        : handleFreshContent(pageParam), // Handle fresh content when place is not set
    {
      getNextPageParam: lastPage => lastPage?.lastVisible || null, // Fetch more posts based on lastVisible (cursor)
      staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache data for 10 minutes
      refetchInterval: 2 * 60 * 1000,
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
    if (place) {
      const detail: PlaceDetailsResponse = await fetchPlaceDetails(
        place.placeId
      );
      const tokens = await sendNotificationHandler({
        latitude: detail.result.geometry.location?.lat,
        longitude: detail.result.geometry.location?.lng,
      });
      tokens.forEach(token => {
        sendPushNotification(token, place.placeId, senderToken ?? '');
      });
    }
  }

  async function toggleComments(postId: string) {
    setPostId(postId);
    setShowComments(true);
  }

  return (
    <Layout pageTitle={t('feed')}>
      <FeedHeader place={place} setPlace={setPlace} />
      <NotificationHandler navigation={navigation} userData={userData} />

      {isLoading ? (
        <LoadingIndicator />
      ) : postsData?.pages.length ? (
        <PostsList
          posts={postsData.pages.flatMap(page => page.posts)}
          zoomedPost={zoomedPost}
          setZoomedPost={setZoomedPost}
          userData={userData}
          place={place}
          numberOfDaysSinceLastPostedPhoto={numberOfDaysSinceLastPostedPhoto}
          requestPhoto={requestPhoto}
          onCommentPress={toggleComments}
          isFiltering={!!place}
          onRefresh={onRefresh}
          loading={isRefetching}
          isFetchingNextPage={isFetchingNextPage}
          fetchMorePosts={fetchMorePosts} // Pagination function passed here
        />
      ) : (
        <EmptyState place={place} requestPhoto={requestPhoto} />
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
