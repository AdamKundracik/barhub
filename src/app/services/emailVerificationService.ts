import { API_CONFIG, ENDPOINTS } from '../config/api';
import { authService } from './authService';

class EmailVerificationService {
  /**
   * Send verification email (public - for registration)
   */
  async sendVerificationEmail(email: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.SEND_VERIFICATION_EMAIL}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      console.log(
        '[EmailVerificationService] Verification email sent to:',
        email
      );
    } catch (error) {
      console.error('Send verification email error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email (authenticated users only)
   */
  async resendVerificationEmail(): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.RESEND_VERIFICATION_EMAIL}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Failed to resend verification email'
        );
      }

      console.log('[EmailVerificationService] Verification email resent');
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  }

  /**
   * Validate verification token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.VALIDATE_EMAIL_TOKEN}?token=${token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Validate token error:', error);
      return false;
    }
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.VERIFY_EMAIL}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || 'Failed to verify email'
        );
      }
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }
}

export const emailVerificationService = new EmailVerificationService();
