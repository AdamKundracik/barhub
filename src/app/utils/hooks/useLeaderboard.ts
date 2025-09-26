import { useQuery } from 'react-query';
import leaderboardClient, {
  LeaderboardUser,
} from '@/src/app/utils/services/leaderboard-service';

export const useLeaderboard = (period: 'week' | 'all') => {
  return useQuery<
    { topUsers: LeaderboardUser[]; currentUser: LeaderboardUser | null },
    Error
  >(
    ['leaderboard', period],
    () => leaderboardClient.getLeaderboard(period),
    { staleTime: 1000 * 60 } // cache na 1 min
  );
};
