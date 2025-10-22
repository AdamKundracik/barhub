import { useQuery } from 'react-query';
import { postService } from '../services/postService';
import { PostHighlightDTO } from '../types/dto';

export const useUserHighlights = (userId: string | undefined) => {
  const queryResult = useQuery<PostHighlightDTO[], Error>(
    ['userHighlights', userId],
    async () => {
      if (!userId) return [];
      return await postService.getUserHighlightedPosts(userId);
    },
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
    }
  );

  return {
    highlights: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};
