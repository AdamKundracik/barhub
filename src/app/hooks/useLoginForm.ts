import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';

export interface LoginFormData {
  email: string;
  password: string;
}

export const useLoginForm = () => {
  const { t } = useTranslation();
  const { login, signInWithGoogle, signInWithApple } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});

  // Validation helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (field: keyof LoginFormData, value: string): string | undefined => {
    switch (field) {
      case 'email':
        if (!value.trim()) {
          return t('email-required') || 'Email is required';
        }
        if (!isValidEmail(value)) {
          return t('enter-valid-email') || 'Please enter a valid email';
        }
        return undefined;
      case 'password':
        if (!value.trim()) {
          return t('password-required') || 'Password is required';
        }
        if (value.length < 8) {
          return t('password-min-length') || 'Password must be at least 8 characters';
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof LoginFormData>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return isValid;
  };

  const handleEmailPasswordSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    if (!validateForm()) {
      return { success: false, error: t('invalid-form') || 'Please fix the errors' };
    }

    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Email/Password sign-in error:', error);
      
      // Check if it's a 401 Unauthorized error (wrong email/password)
      if (error.response?.status === 401) {
        const errorMessage = t('wrong-email-or-password') || 'Nesprávny email alebo heslo';
        return { success: false, error: errorMessage };
      }
      
      // Check if it's a 500 Internal Server Error
      if (error.response?.status === 500) {
        return { success: false, error: 'Something went wrong. Code 500' };
      }
      
      // General error handling for all other unhandled errors
      const statusCode = error.response?.status;
      if (statusCode) {
        return { success: false, error: `Something went wrong. Code ${statusCode}` };
      }
      
      const errorMessage = error.message || t('unknown-error') || 'An error occurred. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await signInWithApple();
      return { success: true };
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      if (error.message?.includes('canceled') || error.message?.includes('cancel')) {
        // User canceled the sign-in
        return { success: false, error: undefined };
      }
      
      // Check if it's a 500 Internal Server Error
      if (error.response?.status === 500) {
        return { success: false, error: 'Something went wrong. Code 500' };
      }
      
      // General error handling for all other unhandled errors
      const statusCode = error.response?.status;
      if (statusCode) {
        return { success: false, error: `Something went wrong. Code ${statusCode}` };
      }
      
      const errorMessage = error.message || t('unknown-error') || 'Sign-in failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await signInWithGoogle();
      return { success: true };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.message?.includes('canceled') || error.message?.includes('cancel')) {
        // User canceled the sign-in
        return { success: false, error: undefined };
      }
      
      // Check if it's a 500 Internal Server Error
      if (error.response?.status === 500) {
        return { success: false, error: 'Something went wrong. Code 500' };
      }
      
      // General error handling for all other unhandled errors
      const statusCode = error.response?.status;
      if (statusCode) {
        return { success: false, error: `Something went wrong. Code ${statusCode}` };
      }
      
      const errorMessage = error.message || t('unknown-error') || 'Sign-in failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    updateField,
    handleBlur,
    errors,
    touched,
    loading,
    isValidEmail,
    handleEmailPasswordSignIn,
    handleAppleSignIn,
    handleGoogleSignIn,
  };
};
