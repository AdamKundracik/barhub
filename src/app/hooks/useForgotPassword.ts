import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

export const useForgotPassword = (t: (key: string) => string) => {
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
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      return { success: true };
    } catch (error: any) {
      console.error('Error sending password reset email:', error);

      let errorMessage;

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = t('user-not-found');
          break;
        case 'auth/invalid-email':
          errorMessage = t('invalid-email');
          break;
        case 'auth/too-many-requests':
          errorMessage = t('too-many-requests');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('network-error');
          break;
        default:
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
