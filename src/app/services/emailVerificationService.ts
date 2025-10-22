import { ENDPOINTS } from '../config/api';
import { axiosClient } from '../utils/api/axiosClient';
import { useUserStore } from '../utils/store/userStore';

class EmailVerificationService {
  /**
   * Send verification email (public - for registration)
   */
  async sendVerificationEmail(email: string): Promise<void> {
    try {
      await axiosClient.post(ENDPOINTS.AUTH.SEND_VERIFICATION_EMAIL, { email });
    } catch (error) {
      console.error('EmailVerificationService: Send verification email error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email (authenticated users only)
   */
  async resendVerificationEmail(): Promise<void> {
    try {
      // Get current user email from store
      const userEmail = useUserStore.getState().getEmail();
      if (!userEmail) {
        throw new Error('User email not found');
      }

      await axiosClient.post(ENDPOINTS.AUTH.RESEND_VERIFICATION_EMAIL, { 
        email: userEmail 
      });
    } catch (error) {
      console.error('EmailVerificationService: Resend verification email error:', error);
      throw error;
    }
  }

  /**
   * Validate verification token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const data = await axiosClient.get(
        `${ENDPOINTS.AUTH.VALIDATE_EMAIL_TOKEN}?token=${token}`
      );
      return data.valid;
    } catch (error) {
      console.error('EmailVerificationService: Validate token error:', error);
      return false;
    }
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await axiosClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    } catch (error) {
      console.error('EmailVerificationService: Verify email error:', error);
      throw error;
    }
  }
}

export const emailVerificationService = new EmailVerificationService();
