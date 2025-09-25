import { useQuery } from 'react-query';
import leaderboardClient, {
  LeaderboardResponse,
} from '@/src/app/utils/services/leaderboard-service';

export const useLeaderboard = () => {
  return useQuery<LeaderboardResponse, Error>(
    ['leaderboard'],
    async () => {
      return leaderboardClient.getLeaderboard();
    },
    {
      staleTime: 1000 * 60, // 1 minúta cache
      refetchOnWindowFocus: false, // nevolať automaticky pri focus
    }
  );
};
