import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Layout from '../../components/user/Shared/Layout';
import NotificationHandler from '../../components/user/NewsFeed/NotificationHandler';
import FeedHeader from '../../components/user/NewsFeed/FeedHeader';
import { UserStackList } from '../../utils/types/screen-types';
import { usePlaceStore } from '../../utils/store/placesStore';
import { useFiltersStore } from '../../utils/store/filtersStorage';
import { usePhotoRequest } from '../../utils/hooks/NewsFeed/usePhotoRequest';
import { usePostZoom } from '../../utils/hooks/NewsFeed/usePostZoom';
import { useUserUploadData } from '../../utils/hooks/NewsFeed/useUserUploadData';
import { useNewsFeedEffects } from '../../utils/hooks/NewsFeed/useNewsFeedEffects';
import { useNewsFeedData } from '../../utils/hooks/NewsFeed/usePostData';
import { useComments } from '../../utils/hooks/NewsFeed/useComments';
import { FeedContent } from './NewsFeed/FeedContent';

export const NewsFeed = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();

  // Store hooks
  const { placeId, placeName } = usePlaceStore();
  const { distance } = useFiltersStore();

  // Data hooks
  const {
    posts,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchMorePosts,
  } = useNewsFeedData();

  // Feature hooks
  const { requestPhoto } = usePhotoRequest();
  const { commentsState, openComments, closeComments } = useComments();
  const { zoomedPost, setZoomedPost } = usePostZoom();
  const { daysSinceLastUpload, userData } = useUserUploadData();

  // Effects
  useNewsFeedEffects({ placeId, distance, refetch });

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <Layout pageTitle={t('feed')}>
      <FeedHeader placeName={placeName} />
      <NotificationHandler navigation={navigation} userData={userData} />

      <FeedContent
        isLoading={isLoading}
        posts={posts}
        isRefetching={isRefetching}
        onRefresh={handleRefresh}
        hasNextPage={hasNextPage}
        zoomedPost={zoomedPost}
        setZoomedPost={setZoomedPost}
        userData={userData}
        daysSinceLastUpload={daysSinceLastUpload}
        requestPhoto={requestPhoto}
        onCommentPress={openComments}
        isFiltering={!!placeId}
        isFetchingNextPage={isFetchingNextPage}
        fetchMorePosts={fetchMorePosts}
      />

      {/* Uncomment when CommentsSlider is ready */}
      {/*<CommentsSlider
        postId={commentsState.postId}
        userId={commentsState.userId ?? ''}
        opened={commentsState.isOpen}
        expoPushToken={commentsState.expoPushToken}
        onClose={closeComments}
      />*/}
    </Layout>
  );
};

export default NewsFeed;
