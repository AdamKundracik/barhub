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
      console.log('[LeaderboardService] Getting top 100 leaderboard:', type, currentUserId);
      
      const response = await apiUtils.get<LeaderboardResponseDTO>(
        ENDPOINTS.LEADERBOARDS.TOP_100(type, currentUserId)
      );
      
      console.log('[LeaderboardService] Leaderboard fetched successfully');
      return response;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Get leaderboard by type
  async getLeaderboardByType(type: 'WEEKLY' | 'MONTHLY' | 'YEARLY'): Promise<LeaderboardDTO[]> {
    try {
      console.log('[LeaderboardService] Getting leaderboard by type:', type);
      
      const response = await apiUtils.get<LeaderboardDTO[]>(
        ENDPOINTS.LEADERBOARDS.BY_TYPE(type)
      );
      
      console.log('[LeaderboardService] Leaderboard by type fetched successfully');
      return response;
    } catch (error) {
      console.error('Error fetching leaderboard by type:', error);
      throw error;
    }
  }

  // Get leaderboard by client ID
  async getLeaderboardByClient(clientId: string): Promise<LeaderboardDTO[]> {
    try {
      console.log('[LeaderboardService] Getting leaderboard by client:', clientId);
      
      const response = await apiUtils.get<LeaderboardDTO[]>(
        ENDPOINTS.LEADERBOARDS.BY_CLIENT(clientId)
      );
      
      console.log('[LeaderboardService] Leaderboard by client fetched successfully');
      return response;
    } catch (error) {
      console.error('Error fetching leaderboard by client:', error);
      throw error;
    }
  }

  // Get all leaderboards
  async getAllLeaderboards(): Promise<LeaderboardDTO[]> {
    try {
      console.log('[LeaderboardService] Getting all leaderboards');
      
      const response = await apiUtils.get<LeaderboardDTO[]>(
        ENDPOINTS.LEADERBOARDS.BASE
      );
      
      console.log('[LeaderboardService] All leaderboards fetched successfully');
      return response;
    } catch (error) {
      console.error('Error fetching all leaderboards:', error);
      throw error;
    }
  }
}

export const leaderboardService = new LeaderboardService();
