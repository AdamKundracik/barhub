import React, { useEffect, useState } from 'react';
import Layout from '../../components/user/Shared/Layout';
import { useInfiniteQuery } from 'react-query';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { handleFreshContent } from '../../utils/helper-functions/posts-functions';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
import { PlaceDetail } from '../../utils/types/types';
import NotificationHandler from '../../components/user/NewsFeed/NotificationHandler';
import LoadingIndicator from '../../components/user/NewsFeed/LoadingIndicator';
import PostsList from '../../components/user/NewsFeed/PostList';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { sendNotificationHandler } from '../../utils/helper-functions/sendNotificationHandler';
import { sendPushNotification } from '../../utils/services/notofications-handler';
import FeedHeader from '../../components/user/NewsFeed/FeedHeader';
import CommentsSlider from '../../components/user/NewsFeed/Post/Comments/CommentsSlider';
import { usePlaceStore } from '../../utils/store/placesStore';
import EmptyState from '../../components/user/NewsFeed/EmptyState';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import PostLoaderView from '../../components/user/NewsFeed/Post/Loaders/PostLoaderView';

export const NewsFeed = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { userData } = useUserContext();
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const { users } = useUserContext();
  const { t } = useTranslation();

  const { placeId, placeName, setPlaceDetail } = usePlaceStore();
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
      handleFreshContent(pageParam, placeId, userData?.location), // Handle fresh content when place is not set
    {
      getNextPageParam: lastPage => lastPage?.lastVisible || null, // Fetch more posts based on lastVisible (cursor)
    }
  );

  useEffect(() => {
    if (placeId) refetch();
  }, [placeId]);

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
        <PostLoaderView />
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
      <CommentsSlider
        postId={postId}
        opened={showComments}
        onClose={() => setShowComments(false)}
      />
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
