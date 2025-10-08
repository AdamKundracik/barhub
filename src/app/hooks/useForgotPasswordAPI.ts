import { useState } from 'react';
import { authService } from '../services/authService';

export const useForgotPasswordAPI = (t: (key: string) => string) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isValidEmail = (value: string): boolean => {
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
  };

  const isFormValid = (): boolean => {
    return email !== '' && isValidEmail(email);
  };

  const sendResetEmail = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isFormValid() || loading) {
      return { success: false, error: t('invalid-email') };
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
      return { success: true };
    } catch (error: any) {
      console.error('Error sending password reset email:', error);

      let errorMessage;

      if (error.message?.includes('not found')) {
        errorMessage = t('user-not-found');
      } else if (error.message?.includes('network')) {
        errorMessage = t('network-error');
      } else {
        errorMessage = error.message || t('something-went-wrong');
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setEmailSent(false);
  };

  return {
    email,
    setEmail,
    loading,
    emailSent,
    isValidEmail,
    isFormValid,
    sendResetEmail,
    resetForm,
  };
};

