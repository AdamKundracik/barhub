import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  JwtAuthenticationResponseDTO,
  SocialLoginRequestDTO,
} from '../types/dto';

class SocialAuthService {
  /**
   * Sign in with Google
   * @param idToken Google ID token from Google Sign-In
   * @param email User email from Google
   * @param name User display name from Google
   * @param photoUrl User photo URL from Google (optional)
   */
  async signInWithGoogle(
    idToken: string,
    email: string,
    name: string,
    photoUrl?: string
  ): Promise<JwtAuthenticationResponseDTO> {
    try {
      const request: SocialLoginRequestDTO = {
        idToken,
        provider: 'google',
        email,
        name,
        photoUrl,
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
   * @param email User email from Apple
   * @param name User display name from Apple
   */
  async signInWithApple(
    idToken: string,
    email: string,
    name: string
  ): Promise<JwtAuthenticationResponseDTO> {
    try {
      const request: SocialLoginRequestDTO = {
        idToken,
        provider: 'apple',
        email,
        name,
      };

      return await apiUtils.post<JwtAuthenticationResponseDTO>(
        ENDPOINTS.AUTH.APPLE_SIGNIN,
        request
      );
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          'Apple Sign-In failed'
      );
    }
  }
}

export const socialAuthService = new SocialAuthService();
