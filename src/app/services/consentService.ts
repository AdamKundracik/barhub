import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import { AcceptConsentRequestDTO, ConsentStatusDTO, ConsentItemDTO } from '../types/dto';

class ConsentService {
  /**
   * Accept consents (e.g., after login when consents are outdated)
   * @param userId User ID
   * @param consentTypes Array of consent types to accept
   * @param versions Record of consent versions (optional, defaults to current versions)
   */
  async acceptConsents(
    userId: string,
    consentTypes: ('TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES')[],
    versions?: Record<string, string>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Get current versions if not provided
      const consentVersions = versions || await this.getCurrentVersions();

      // Build consent items
      const consentItems: ConsentItemDTO[] = consentTypes.map(type => ({
        consentType: type,
        version: consentVersions[type] || '1.0',
        accepted: true,
      }));

      const request: AcceptConsentRequestDTO = {
        consents: consentItems,
      };

      await apiUtils.post(`${ENDPOINTS.CONSENTS.ACCEPT}?userId=${userId}`, request);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error accepting consents:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to accept consents',
      };
    }
  }

  /**
   * Get current consent status for logged-in user
   * @param userId User ID
   */
  async getConsentStatus(userId: string): Promise<ConsentStatusDTO> {
    try {
      const response = await apiUtils.get<ConsentStatusDTO>(`${ENDPOINTS.CONSENTS.STATUS}?userId=${userId}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching consent status:', error);
      throw new Error(
        error?.response?.data?.message || error?.message || 'Failed to fetch consent status'
      );
    }
  }

  /**
   * Get current versions of all consent documents
   * Public endpoint - no auth required (for registration)
   */
  async getCurrentVersions(): Promise<Record<string, string>> {
    try {
      const response = await apiUtils.get<Record<string, string>>(ENDPOINTS.CONSENTS.VERSIONS);
      return response;
    } catch (error: any) {
      console.error('Error fetching consent versions:', error);
      // Return default versions as fallback
      return {
        'TERMS_OF_SERVICE': '1.0',
        'PRIVACY_POLICY': '1.0',
        'COMMUNITY_GUIDELINES': '1.0',
      };
    }
  }

  /**
   * Update consent version (Admin only)
   * @param consentType Type of consent to update
   * @param newVersion New version string
   * @param description Optional description of changes
   */
  async updateConsentVersion(
    consentType: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES',
    newVersion: string,
    description?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const request = {
        consentType,
        newVersion,
        description: description || `Updated to version ${newVersion}`,
      };

      await apiUtils.put(ENDPOINTS.ADMIN.CONSENT_VERSIONS, request);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating consent version:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to update version',
      };
    }
  }

  /**
   * Reload consent versions cache (Admin only)
   */
  async reloadCache(): Promise<{ success: boolean; message?: string }> {
    try {
      await apiUtils.post(ENDPOINTS.ADMIN.CONSENT_RELOAD_CACHE, {});
      return { success: true };
    } catch (error: any) {
      console.error('Error reloading cache:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to reload cache',
      };
    }
  }
}

export const consentService = new ConsentService();

