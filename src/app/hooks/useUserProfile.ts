import { useQuery } from 'react-query';
import { userService } from '../services/userService';
import { UserProfileDTO } from '../types/dto';

export const useUserProfile = (userId: string | undefined) => {
  return useQuery<UserProfileDTO | null, Error>(
    ['userProfile', userId],
    async () => {
      if (!userId) {
        return null;
      }
      return await userService.getUserProfile(userId);
    },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    }
  );
};
