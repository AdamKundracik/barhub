import { useQuery } from 'react-query';
import { leaderboardService } from '@/src/app/services/leaderboardService';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { LeaderboardResponseDTO } from '@/src/app/types';

// Convert backend DTO to frontend format
const convertLeaderboardData = (
  data: LeaderboardResponseDTO
): {
  topUsers: Array<{
    userId: string;
    name: string;
    photoUrl: string;
    points: number;
    rank: number;
  }>;
  currentUser: {
    userId: string;
    name: string;
    photoUrl: string;
    points: number;
    rank: null;
  } | null;
  currentUserInTop100: boolean;
} => {
  const topUsers = data.top100.map((item, index) => ({
    userId: item.client.id.toString(),
    name: item.client.name || 'Anonymous',
    photoUrl: item.client.photoUrl || '',
    points: item.points,
    rank: index + 1,
  }));

  const currentUser = data.currentUser
    ? {
        userId: data.currentUser.client.id.toString(),
        name: data.currentUser.client.name || 'Anonymous',
        photoUrl: data.currentUser.client.photoUrl || '',
        points: data.currentUser.points,
        rank: null, // Will be calculated separately
      }
    : null;

  return {
    topUsers,
    currentUser,
    currentUserInTop100: data.currentUserInTop100,
  };
};

export const useLeaderboard = (
  period: 'week' | 'monthly' | 'yearly'
): {
  data:
    | {
        topUsers: Array<{
          userId: string;
          name: string;
          photoUrl: string;
          points: number;
          rank: number;
        }>;
        currentUser: {
          userId: string;
          name: string;
          photoUrl: string;
          points: number;
          rank: null;
        } | null;
        currentUserInTop100: boolean;
      }
    | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} => {
  const { user } = useAuth();

  // Map frontend period to backend type
  const backendType = 
    period === 'week' ? 'WEEKLY' : 
    period === 'monthly' ? 'MONTHLY' : 
    'YEARLY';

  return useQuery(
    ['leaderboard', period],
    async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await leaderboardService.getTop100WithCurrentUser(
        backendType,
        user.id.toString()
      );

      return convertLeaderboardData(response);
    },
    {
      staleTime: 1000 * 60 * 5, // cache na 5 min
      enabled: !!user?.id, // Only fetch when user is authenticated
    }
  );
};
