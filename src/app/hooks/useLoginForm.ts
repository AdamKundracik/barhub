import { useState } from 'react';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as AppleAuth from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '@/firebaseConfig';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';

export interface LoginFormData {
  email: string;
  password: string;
}

export const useLoginForm = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});

  // Configure Google Sign-In
  GoogleSignin.configure({
    webClientId:
      '995791421821-tedjmv2vuu6coprv5ij6h5dje9io5rls.apps.googleusercontent.com',
    iosClientId:
      '995791421821-fjmj5qmj8j48e4s13nktbiqkt6gq83jb.apps.googleusercontent.com',
    offlineAccess: true,
  });

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

  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-login-credentials':
      case 'auth/wrong-password':
        return t('wrong-password') || 'Invalid email or password';
      case 'auth/invalid-email':
        return t('invalid-email') || 'Invalid email address';
      case 'auth/user-not-found':
        return t('user-not-found') || 'User not found';
      case 'auth/email-already-in-use':
        return t('email-already-in-use') || 'Email already in use';
      case 'auth/weak-password':
        return t('weak-password') || 'Password is too weak';
      case 'auth/operation-not-allowed':
        return t('operation-not-allowed') || 'Operation not allowed';
      case 'auth/account-exists-with-different-credential':
        return t('account-exists-with-different-credential') || 'Account exists with different credential';
      case 'auth/credential-already-in-use':
        return t('credential-already-in-use') || 'Credential already in use';
      case 'auth/popup-closed-by-user':
        return t('popup-closed-by-user') || 'Sign-in popup closed';
      case 'auth/popup-blocked':
        return t('popup-blocked') || 'Sign-in popup blocked';
      case 'auth/invalid-action-code':
        return t('invalid-action-code') || 'Invalid action code';
      case 'auth/expired-action-code':
        return t('expired-action-code') || 'Action code expired';
      case 'auth/invalid-verification-code':
        return t('invalid-verification-code') || 'Invalid verification code';
      case 'auth/invalid-verification-id':
        return t('invalid-verification-id') || 'Invalid verification ID';
      case 'auth/requires-recent-login':
        return t('requires-recent-login') || 'Please sign in again';
      case 'auth/session-expired':
        return t('session-expired') || 'Session expired';
      case 'auth/too-many-requests':
        return t('too-many-requests') || 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return t('network-error') || 'Network error. Please check your connection.';
      default:
        return t('unknown-error') || 'An error occurred. Please try again.';
    }
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
      const errorMessage = error.message || t('unknown-error') || 'An error occurred. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const idToken = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });

      const provider = new OAuthProvider('apple.com');
      if (idToken.identityToken) {
        const appleCredentials = provider.credential({
          idToken: idToken.identityToken,
        });
        await signInWithCredential(auth, appleCredentials);
        return { success: true };
      }
      
      return { success: false, error: t('unknown-error') || 'Sign-in failed' };
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in
        return { success: false, error: undefined };
      }
      return { success: false, error: getFirebaseErrorMessage(error.code) };
    }
  };

  const handleGoogleSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = GoogleAuthProvider.credential(idToken);

      await signInWithCredential(auth, googleCredential);
      return { success: true };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User canceled the sign-in
        return { success: false, error: undefined };
      }
      return { success: false, error: getFirebaseErrorMessage(error.code) };
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
