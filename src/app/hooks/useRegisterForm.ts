import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  repeatPassword: string;
  dateOfBirth: Date;
  acceptsTermsOfUse: boolean;
  profileImage: string | null;
}

export interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  repeatPassword?: string;
  general?: string;
}

export const useRegisterForm = (t: (key: string, options?: any) => string) => {
  const { register, registerWithPhoto } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
    repeatPassword: '',
    dateOfBirth: new Date(2000, 0, 1),
    acceptsTermsOfUse: false,
    profileImage: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Set<keyof RegisterFormData>
  >(new Set());
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValidEmail = (email: string): boolean => {
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
  };

  const validateField = (
    field: keyof RegisterFormData,
    value: any
  ): string | undefined => {
    switch (field) {
      case 'email':
        if (!value) return t('email-required');
        if (!isValidEmail(value)) return t('invalid-email');
        break;
      case 'username':
        if (!value) return t('username-required');
        if (value.trim().length < 3) return t('too-short');
        break;
      case 'password':
        if (!value) return t('password-required');
        if (value.length < 6) return t('weak-password');
        break;
      case 'repeatPassword':
        if (!value) return t('password-required');
        if (value !== formData.password) return t('noMatchingPasswords');
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    const usernameError = validateField('username', formData.username);
    if (usernameError) newErrors.username = usernameError;

    const passwordError = validateField('password', formData.password);
    if (passwordError) newErrors.password = passwordError;

    const repeatPasswordError = validateField(
      'repeatPassword',
      formData.repeatPassword
    );
    if (repeatPasswordError) newErrors.repeatPassword = repeatPasswordError;

    if (!formData.acceptsTermsOfUse) {
      newErrors.general = t('accept-terms-required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof RegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));

    // Only validate on blur if the field has been touched or form was submitted
    if (touchedFields.has(field) || submitted) {
      const error = validateField(field, formData[field]);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleRegister = async (): Promise<boolean> => {
    setSubmitted(true);

    if (!validateForm()) {
      return false;
    }

    setLoading(true);
    try {
      // Format date of birth to ISO LocalDateTime format for backend
      const year = formData.dateOfBirth.getFullYear();
      const month = String(formData.dateOfBirth.getMonth() + 1).padStart(2, '0');
      const day = String(formData.dateOfBirth.getDate()).padStart(2, '0');
      const formattedDateOfBirth = `${year}-${month}-${day}T00:00:00`;
      
      const credentials = {
        name: formData.username,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formattedDateOfBirth,
      };

      // Use registerWithPhoto if profile image is provided, otherwise use regular register
      if (formData.profileImage) {
        await registerWithPhoto(credentials, formData.profileImage);
      } else {
        await register(credentials);
      }

      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = error.message || t('sing-up-error');

      // Handle specific error messages from backend
      if (error.message?.includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (error.message?.includes('password')) {
        setErrors(prev => ({ ...prev, password: errorMessage }));
      } else {
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = (): boolean => {
    return (
      formData.email !== '' &&
      isValidEmail(formData.email) &&
      formData.password !== '' &&
      formData.password.length >= 6 &&
      formData.repeatPassword !== '' &&
      formData.username !== '' &&
      formData.username.trim().length >= 3 &&
      formData.acceptsTermsOfUse &&
      formData.password === formData.repeatPassword &&
      formData.dateOfBirth !== null
    );
  };

  return {
    formData,
    errors,
    loading,
    touchedFields,
    submitted,
    updateField,
    handleBlur,
    handleRegister,
    isFormValid,
  };
};
