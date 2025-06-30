import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/user/Shared/Layout';
import { useInfiniteQuery } from 'react-query';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { handleFreshContent } from '../../utils/functions/posts-functions';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
import {
  OccupancyTypes,
  PlaceDetail,
  PlaceType,
} from '../../utils/types/types';
import NotificationHandler from '../../components/user/NewsFeed/NotificationHandler';
import LoadingIndicator from '../../components/user/NewsFeed/LoadingIndicator';
import PostsList from '../../components/user/NewsFeed/PostList';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { sendNotificationHandler } from '../../utils/helper-functions/sendNotificationHandler';
import { sendRequestNotification } from '../../utils/functions/notofications-handler';
import FeedHeader from '../../components/user/NewsFeed/FeedHeader';
import CommentsSlider from '../../components/user/NewsFeed/Post/Comments/CommentsSlider';
import { usePlaceStore } from '../../utils/store/placesStore';
import EmptyState from '../../components/user/NewsFeed/EmptyState';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import PostLoaderView from '../../components/user/NewsFeed/Post/Loaders/PostLoaderView';
import { useFiltersStore } from '../../utils/store/filtersStorage';

export const NewsFeed = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const { placeId, placeName, setPlaceDetail } = usePlaceStore();
  const { distance, selectedPlaces, selectedOccupancy } = useFiltersStore();
  const { userData } = useUserContext();

  const [expoPushToken, setExpoPushToken] = useState('');
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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
    ({ pageParam = null }) =>
      handleFreshContent(distance, pageParam, placeId, userData?.location),
    {
      getNextPageParam: lastPage => lastPage?.lastVisible || null,
    }
  );

  const filteredPosts = useMemo(() => {
    if (!postsData?.pages) {
      return [];
    }

    const allPosts = postsData.pages.flatMap(page => page.posts);

    if (selectedPlaces.length === 0 && selectedOccupancy.length === 0) {
      return allPosts;
    }

    return allPosts.filter(post => {
      const matchesPlaceType =
        selectedPlaces.length === 0 ||
        post.placeTypes?.some(type =>
          selectedPlaces.includes(type as PlaceType)
        );

      const matchesOccupancy =
        selectedOccupancy.length === 0 ||
        selectedOccupancy.includes(post.occupancy as OccupancyTypes);

      return matchesPlaceType && matchesOccupancy;
    });
  }, [postsData?.pages, selectedPlaces, selectedOccupancy]);

  useEffect(() => {
    if (placeId) refetch();
  }, [placeId]);

  useEffect(() => {
    refetch();
  }, [distance]);

  const onRefresh = async () => {
    await refetch();
  };

  const fetchMorePosts = async () => {
    if (hasNextPage) {
      await fetchNextPage();
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
        sendRequestNotification(token, placeId, placeName, senderToken ?? '');
      });
    }
  }

  async function toggleComments(
    postId: string,
    expoPushToken: string,
    userId: string
  ) {
    setPostId(postId);
    setExpoPushToken(expoPushToken);
    setUserId(userId);
    setShowComments(true);
  }

  return (
    <Layout pageTitle={t('feed')}>
      <FeedHeader placeName={placeName} />
      <NotificationHandler navigation={navigation} userData={userData} />

      {isLoading ? (
        <PostLoaderView />
      ) : filteredPosts?.length ? (
        <PostsList
          hasMorePosts={hasNextPage}
          posts={filteredPosts}
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
          fetchMorePosts={fetchMorePosts}
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
      {/*<CommentsSlider*/}
      {/*  postId={postId}*/}
      {/*  userId={userId ?? ''}*/}
      {/*  opened={showComments}*/}
      {/*  expoPushToken={expoPushToken}*/}
      {/*  onClose={() => setShowComments(false)}*/}
      {/*/>*/}
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewsFeed;
