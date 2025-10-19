import { useQuery } from 'react-query';
import { postService } from '../services/postService';
import { Post } from '@/src/app/types/postTypes';
import { useUserStore } from '../utils/store/userStore';

export const usePostDetail = (postId: string) => {
  const { getUserId } = useUserStore();
  const userId = getUserId();

  const queryResult = useQuery<Post, Error>(
    ['post', postId],
    async () => {
      const post = await postService.getPostById(postId, userId ? parseInt(userId, 10) : undefined);
      if (!post) {
        throw new Error('Post not found');
      }
      return post;
    },
    {
      enabled: !!postId,
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache at all
      retry: 1,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    }
  );

  return {
    post: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};

