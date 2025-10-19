import { useQuery } from 'react-query';
import { favoriteService } from '../services/favoriteService';
import { FavoritePlaceDTO } from '../types/dto';

export const useUserFavorites = (userId: string | null | undefined) => {
  const queryResult = useQuery<FavoritePlaceDTO[], Error>(
    ['userFavorites', userId],
    async () => {
      if (!userId) return [];
      return await favoriteService.getUserFavorites(parseInt(userId, 10));
    },
    {
      enabled: !!userId,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: true,
    }
  );

  return {
    favorites: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};

