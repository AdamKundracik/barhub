import { useMemo } from 'react';
import { usePhotoRequest } from './usePhotoRequest';
import { useComments } from './useComments';
import { usePostZoom } from './usePostZoom';
import { useNewsFeedEffects } from './useNewsFeedEffects';
import { usePlaceStore } from '../../store/placesStore';
import { useFiltersStore } from '../../store/filtersStorage';
import { useNewsFeedData } from './usePostData';
import { useUserStore } from '@/src/app/utils/store/userStore';

export const useNewsFeed = () => {
  const { placeId } = usePlaceStore();
  const { distance } = useFiltersStore();
  const { userData } = useUserStore();

  const feedData = useNewsFeedData();
  const photoRequest = usePhotoRequest();
  const comments = useComments();
  const postZoom = usePostZoom();

  useNewsFeedEffects({
    placeId,
    distance,
    refetch: feedData.refetch,
  });

  const handleRefresh = async () => {
    await feedData.refetch();
  };

  const feedProps = useMemo(
    () => ({
      isLoading: feedData.isLoading,
      posts: feedData.posts,
      isRefetching: feedData.isRefetching,
      onRefresh: handleRefresh,
      hasNextPage: feedData.hasNextPage,
      zoomedPost: postZoom.zoomedPost,
      setZoomedPost: postZoom.setZoomedPost,
      userData: userData,
      requestPhoto: photoRequest.requestPhoto,
      onCommentPress: comments.openComments,
      isFiltering: !!placeId,
      isFetchingNextPage: feedData.isFetchingNextPage,
      fetchMorePosts: feedData.fetchMorePosts,
    }),
    [
      feedData,
      postZoom,
      photoRequest.requestPhoto,
      comments.openComments,
      placeId,
    ]
  );

  return {
    feedProps,
    commentsState: comments.commentsState,
    closeComments: comments.closeComments,
  };
};
