import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { AcceptConsentRequestDTO } from '../types/dto';
import {
  getUnicodeValidationMessage,
  isValidUnicodeUsername,
} from '../utils/validation/unicodeValidation';

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  repeatPassword: string;
  dateOfBirth: Date;
  acceptsTermsOfUse: boolean;
  acceptsPrivacyPolicy: boolean;
  acceptsCommunityGuidelines: boolean;
  profileImage: string | null;
}

export interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  repeatPassword?: string;
  dateOfBirth?: string;
  general?: string;
}

export const useRegisterForm = (t: (key: string, options?: any) => string) => {
  const { register, registerWithPhoto } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
    repeatPassword: '',
    dateOfBirth: (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 13);
      return date;
    })(),
    acceptsTermsOfUse: false,
    acceptsPrivacyPolicy: false,
    acceptsCommunityGuidelines: false,
    profileImage: null,
  });

  const [consentVersions, setConsentVersions] = useState<
    Record<string, string>
  >({
    TERMS_OF_SERVICE: '1.0',
    PRIVACY_POLICY: '1.0',
    COMMUNITY_GUIDELINES: '1.0',
  });

  // Note: Consent versions are fetched from backend during registration
  // No need to fetch them here as user is not authenticated yet

  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Set<keyof RegisterFormData>
  >(new Set());
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValidEmail = (email: string): boolean => {
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
  };

  const isValidAge = (birthDate: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Check if birthday has occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return age - 1 >= 13;
    }

    return age >= 13;
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
        if (!isValidUnicodeUsername(value)) {
          return getUnicodeValidationMessage(value).includes('emoji')
            ? t('username-invalid-characters')
            : t('username-standard-chars-only');
        }
        break;
      case 'password':
        if (!value) return t('password-required');
        if (value.length < 6) return t('weak-password');
        break;
      case 'repeatPassword':
        if (!value) return t('password-required');
        if (value !== formData.password) return t('noMatchingPasswords');
        break;
      case 'dateOfBirth':
        if (!value) return t('date-of-birth-required');
        if (!isValidAge(value)) return t('minimum-age-required');
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

    const dateOfBirthError = validateField('dateOfBirth', formData.dateOfBirth);
    if (dateOfBirthError) newErrors.dateOfBirth = dateOfBirthError;

    if (!formData.acceptsTermsOfUse) {
      newErrors.general = t('accept-terms-required');
    }

    if (!formData.acceptsPrivacyPolicy) {
      newErrors.general = t('accept-privacy-required');
    }

    if (!formData.acceptsCommunityGuidelines) {
      newErrors.general = t('accept-community-required');
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
      const month = String(formData.dateOfBirth.getMonth() + 1).padStart(
        2,
        '0'
      );
      const day = String(formData.dateOfBirth.getDate()).padStart(2, '0');
      const formattedDateOfBirth = `${year}-${month}-${day}T00:00:00`;

      // Build consents object
      const consents: AcceptConsentRequestDTO = {
        consents: [
          {
            consentType: 'TERMS_OF_SERVICE',
            version: consentVersions['TERMS_OF_SERVICE'],
            accepted: formData.acceptsTermsOfUse,
          },
          {
            consentType: 'PRIVACY_POLICY',
            version: consentVersions['PRIVACY_POLICY'],
            accepted: formData.acceptsPrivacyPolicy,
          },
          {
            consentType: 'COMMUNITY_GUIDELINES',
            version: consentVersions['COMMUNITY_GUIDELINES'],
            accepted: formData.acceptsCommunityGuidelines,
          },
        ],
      };

      const credentials = {
        name: formData.username,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formattedDateOfBirth,
        consents,
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
      isValidUnicodeUsername(formData.username) &&
      formData.acceptsTermsOfUse &&
      formData.acceptsPrivacyPolicy &&
      formData.acceptsCommunityGuidelines &&
      formData.password === formData.repeatPassword &&
      formData.dateOfBirth !== null &&
      isValidAge(formData.dateOfBirth)
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
