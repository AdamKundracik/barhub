import { useQuery } from 'react-query';
import { postService } from '../services/postService';
import { Post } from '../types/postTypes';

export const useUserPosts = (userId: string | undefined) => {
  const queryResult = useQuery<Post[], Error>(
    ['userPosts', userId],
    async () => {
      if (!userId) return [];
      return await postService.getUserPosts(userId);
    },
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
    }
  );

  return {
    posts: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};



