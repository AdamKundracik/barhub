import { useState } from 'react';
import { authService } from '../services/authService';

interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useChangePasswordAPI = (t: (key: string) => string) => {
  const [formData, setFormData] = useState<ChangePasswordForm>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const updateField = (field: keyof ChangePasswordForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (
    field: keyof typeof passwordVisibility
  ) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const isPasswordValid = formData.newPassword.length >= 6;
  const passwordsMatch =
    formData.newPassword === formData.confirmPassword &&
    formData.newPassword !== '';

  const isFormValid = (): boolean => {
    return (
      formData.oldPassword !== '' &&
      isPasswordValid &&
      passwordsMatch
    );
  };

  const updatePassword = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isFormValid() || loading) {
      return { success: false, error: t('invalid-form') };
    }

    setLoading(true);

    try {
      await authService.updatePassword(
        formData.oldPassword,
        formData.newPassword
      );
      return { success: true };
    } catch (error: any) {
      console.error('Error updating password:', error);

      let errorMessage;

      if (error.message?.includes('incorrect')) {
        errorMessage = t('current-password-incorrect');
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

  return {
    formData,
    loading,
    passwordVisibility,
    updateField,
    togglePasswordVisibility,
    isPasswordValid,
    passwordsMatch,
    isFormValid,
    updatePassword,
  };
};

