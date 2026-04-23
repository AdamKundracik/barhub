import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import { LeaderboardResponseDTO, LeaderboardDTO } from '../types/dto';

class LeaderboardService {
  // Get top 100 leaderboard with current user
  async getTop100WithCurrentUser(
    type: 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    currentUserId: string
  ): Promise<LeaderboardResponseDTO> {
    try {
      const response = await apiUtils.get<LeaderboardResponseDTO>(
        ENDPOINTS.LEADERBOARDS.TOP_100(type, currentUserId)
      );

      return response;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Get leaderboard by type
  async getLeaderboardByType(
    type: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  ): Promise<LeaderboardDTO[]> {
    try {
      const response = await apiUtils.get<LeaderboardDTO[]>(
        ENDPOINTS.LEADERBOARDS.BY_TYPE(type)
      );

      return response;
    } catch (error) {
      console.error('Error fetching leaderboard by type:', error);
      throw error;
    }
  }

  // Get leaderboard by client ID
  async getLeaderboardByClient(clientId: string): Promise<LeaderboardDTO[]> {
    try {
      const response = await apiUtils.get<LeaderboardDTO[]>(
        ENDPOINTS.LEADERBOARDS.BY_CLIENT(clientId)
      );

      return response;
    } catch (error) {
      console.error('Error fetching leaderboard by client:', error);
      throw error;
    }
  }
}

export const leaderboardService = new LeaderboardService();
