import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebaseConfig';

export interface AddPointsResponse {
  success: boolean;
  pointsAdded: number;
}

export interface LeaderboardUser {
  userId: string;
  displayName: string;
  photoUrl: string;
  points: number;
}

export interface LeaderboardResponse {
  topUsers: LeaderboardUser[];
  currentUser: LeaderboardUser | null;
}

class LeaderboardClient {
  /**
   * Pridanie bodov za pridanie fotky
   */
  public addPhotoPoints = async (): Promise<AddPointsResponse> => {
    try {
      const cloudFunction = httpsCallable<null, AddPointsResponse>(
        functions,
        'addPhotoPoints'
      );

      const response = await cloudFunction();
      return response.data;
    } catch (error) {
      console.error('Error calling addPhotoPoints:', error);
      throw error;
    }
  };

  public getLeaderboard = async (): Promise<LeaderboardResponse> => {
    try {
      const cloudFunction = httpsCallable<null, LeaderboardResponse>(
        functions,
        'getLeaderboard'
      );

      const response = await cloudFunction();
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  };
}

const leaderboardClient = new LeaderboardClient();
export default leaderboardClient;
