import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  JwtAuthenticationResponseDTO,
  SocialLoginRequestDTO,
  AcceptConsentRequestDTO,
} from '../types/dto';

class SocialAuthService {
  /**
   * Sign in with Google
   * @param idToken Google ID token from Google Sign-In
   * @param email User email from Google
   * @param name User display name from Google
   * @param photoUrl User photo URL from Google (optional)
   * @param consents User consents (for new users)
   */
  async signInWithGoogle(
    idToken: string,
    email: string,
    name: string,
    photoUrl?: string,
    consents?: AcceptConsentRequestDTO
  ): Promise<JwtAuthenticationResponseDTO> {
    try {
      const request: SocialLoginRequestDTO = {
        idToken,
        provider: 'google',
        email,
        name,
        photoUrl,
        consents,
      };

      return await apiUtils.post<JwtAuthenticationResponseDTO>(
        ENDPOINTS.AUTH.GOOGLE_SIGNIN,
        request
      );
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          'Google Sign-In failed'
      );
    }
  }

  /**
   * Sign in with Apple
   * @param idToken Apple identity token from Apple Sign-In
   * @param email User email from Apple (optional for existing users)
   * @param name User display name from Apple
   * @param appleUserId Apple User ID
   * @param consents User consents (for new users)
   */
  async signInWithApple(
    idToken: string,
    email: string | undefined,
    name: string,
    appleUserId: string,
    consents?: AcceptConsentRequestDTO
  ): Promise<JwtAuthenticationResponseDTO> {
    try {
      const request: SocialLoginRequestDTO = {
        idToken,
        provider: 'apple',
        email,
        name,
        appleUserId,
        consents,
      };

      console.log('[SocialAuthService] Apple Sign-In request body:', {
        ...request,
        idToken: request.idToken.substring(0, 20) + '...',
      });

      const response = await apiUtils.post<JwtAuthenticationResponseDTO>(
        ENDPOINTS.AUTH.APPLE_SIGNIN,
        request
      );

      console.log('[SocialAuthService] Apple Sign-In response:', response);

      return response;
    } catch (error: any) {
      console.error('[SocialAuthService] Apple Sign-In error:', error);
      console.error(
        '[SocialAuthService] Error response:',
        error?.response?.data
      );
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          'Apple Sign-In failed'
      );
    }
  }
}

export const socialAuthService = new SocialAuthService();
