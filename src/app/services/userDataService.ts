/**
 * User Data Service
 * Handles GDPR-related operations: data export and consent withdrawal
 */

import { apiUtils } from '@/src/app/utils/api/apiClient';
import { ENDPOINTS } from '@/src/app/config/api';

export interface UserDataExportDTO {
  user: {
    id: number;
    email: string;
    username: string;
    name: string;
    dateOfBirth: string | null;
    role: string;
    premium: boolean;
    photoUrl: string | null;
    createdAt: string;
    lastUploadedPostAt: string | null;
  };
  posts: Array<{
    id: number;
    photoUrl: string;
    occupancy: string;
    placeId: string;
    placeName: string;
    placeAddress: string | null;
    isHighlighted: boolean;
    createdAt: string;
    likesCount: number;
  }>;
  likes: Array<{
    postId: number;
    likedAt: string;
  }>;
  reports: Array<{
    postId: number;
    reason: string;
    reportedAt: string;
  }>;
  favoritePlaces: Array<{
    placeId: string;
    placeName: string;
    placeAddress: string | null;
    addedAt: string;
  }>;
  consents: Array<{
    type: string;
    version: string;
    accepted: boolean;
    acceptedAt: string | null;
    ipAddress: string | null;
  }>;
  leaderboard: Array<{
    type: string;
    points: number;
    createdAt: string;
  }>;
  notifications: Array<{
    type: string;
    message: string;
    createdAt: string;
    read: boolean;
  }>;
  exportMetadata: {
    exportedAt: string;
    exportedBy: string;
    dataVersion: string;
    gdprCompliant: boolean;
  };
}

export const userDataService = {
  /**
   * Export all user data (GDPR Right to Access)
   * Returns comprehensive JSON with all user's data
   */
  async exportUserData(): Promise<UserDataExportDTO> {
    try {
      console.log('[userDataService] Exporting data from:', ENDPOINTS.USERS.EXPORT_DATA);
      const response: any = await apiUtils.get(ENDPOINTS.USERS.EXPORT_DATA);
      console.log('[userDataService] Export response:', response);
      
      // Backend might return data directly or wrapped in { data: ... }
      const exportData = response.data || response;
      
      if (!exportData) {
        throw new Error('No data received from server. Export endpoint may not be implemented yet.');
      }
      
      return exportData as UserDataExportDTO;
    } catch (error: any) {
      console.error('[userDataService] Export failed:', error);
      
      // If endpoint doesn't exist yet, show helpful message
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        throw new Error('Export feature is not yet available on the backend. Please implement GET /users/me/export endpoint.');
      }
      
      throw new Error(error.message || 'Failed to export user data');
    }
  },

  /**
   * Withdraw all consents (GDPR Right to Object)
   * This will revoke all consents and require user to re-accept or delete account
   * 
   * ⚠️ WARNING: This action cannot be undone!
   * After withdrawal, user must either:
   * 1. Accept consents again to continue using the app
   * 2. Delete their account if they don't want to accept
   */
  async withdrawAllConsents(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Withdraw all consent types
      const consentTypes: Array<'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES'> = [
        'TERMS_OF_SERVICE',
        'PRIVACY_POLICY',
        'COMMUNITY_GUIDELINES',
      ];
      
      // Withdraw each consent type
      for (const consentType of consentTypes) {
        await this.withdrawConsent(userId, consentType);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('[userDataService] Consent withdrawal failed:', error);
      throw new Error(error.message || 'Failed to withdraw consents');
    }
  },

  /**
   * Withdraw a specific consent type
   * 
   * @param userId - User ID
   * @param consentType - Type of consent to withdraw (TERMS_OF_SERVICE, PRIVACY_POLICY, COMMUNITY_GUIDELINES)
   */
  async withdrawConsent(
    userId: string,
    consentType: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await apiUtils.post(`${ENDPOINTS.CONSENTS.WITHDRAW}?userId=${userId}&consentType=${consentType}`);
      return { success: true };
    } catch (error: any) {
      console.error('[userDataService] Consent withdrawal failed:', error);
      throw new Error(error.message || 'Failed to withdraw consent');
    }
  },
};

