import { useMemo } from 'react';
import { usePhotoRequest } from './usePhotoRequest';
import { useComments } from './useComments';
import { usePostZoom } from './usePostZoom';
import { useUserUploadData } from './useUserUploadData';
import { useNewsFeedEffects } from './useNewsFeedEffects';
import { usePlaceStore } from '../../store/placesStore';
import { useFiltersStore } from '../../store/filtersStorage';
import { useNewsFeedData } from './usePostData';

export const useNewsFeed = () => {
  const { placeId } = usePlaceStore();
  const { distance } = useFiltersStore();

  const feedData = useNewsFeedData();
  const photoRequest = usePhotoRequest();
  const comments = useComments();
  const postZoom = usePostZoom();
  const userUpload = useUserUploadData();

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
      userData: userUpload.userData,
      daysSinceLastUpload: userUpload.daysSinceLastUpload,
      requestPhoto: photoRequest.requestPhoto,
      onCommentPress: comments.openComments,
      isFiltering: !!placeId,
      isFetchingNextPage: feedData.isFetchingNextPage,
      fetchMorePosts: feedData.fetchMorePosts,
    }),
    [
      feedData,
      postZoom,
      userUpload,
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
