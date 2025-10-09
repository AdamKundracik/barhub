import { useQuery } from 'react-query';
import { postService } from '../services/postService';
import { Post } from '@/common/types/postTypes';
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
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  );

  return {
    post: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};

