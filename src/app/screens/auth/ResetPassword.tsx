import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
  postBgColor,
  primaryBgColor,
  separatorColor,
} from '../../utils/styles/colors';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Icons from '@fortawesome/free-solid-svg-icons';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { authService } from '../../services/authService';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useRoute } from '@react-navigation/native';

type InputFieldType = 'password' | 'confirmPassword';

export const ResetPassword = ({ navigation }: any) => {
  const { t } = useTranslation();
  const route = useRoute();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<InputFieldType | null>(null);
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  // Get token from route params (deep link) or query params
  useEffect(() => {
    const params = route.params as any;
    // console.log('[ResetPassword] Route params:', params);

    if (params?.token) {
      // console.log('[ResetPassword] Token from params:', params.token);
      setToken(params.token);
    }
  }, [route.params]);

  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && password !== '';
  const isFormValid = token !== '' && isPasswordValid && passwordsMatch;

  const togglePasswordVisibility = (field: keyof typeof passwordVisibility) => {
    setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleResetPassword = async () => {
    if (!isFormValid || loading) return;

    setLoading(true);

    try {
      await authService.resetPassword(token, password);

      showSuccessToast(
        t('password-reset-success') || 'Password Reset!',
        t('password-reset-success-desc') ||
          'Your password has been reset successfully. You can now login.'
      );

      // Navigate to login after successful reset
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
    } catch (error: any) {
      console.error('Error resetting password:', error);

      let errorMessage = t('something-went-wrong');
      if (error.message?.includes('expired')) {
        errorMessage =
          t('reset-token-expired') ||
          'Reset link has expired. Please request a new one.';
      } else if (error.message?.includes('invalid')) {
        errorMessage = t('reset-token-invalid') || 'Invalid reset link.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showErrorToast(t('error') || 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    field: 'password' | 'confirmPassword',
    translationKey: string
  ) => {
    const value = field === 'password' ? password : confirmPassword;
    const setValue = field === 'password' ? setPassword : setConfirmPassword;

    const isInvalid =
      (field === 'password' && value.length > 0 && !isPasswordValid) ||
      (field === 'confirmPassword' && value.length > 0 && !passwordsMatch);

    const showHelper =
      field === 'password' &&
      value.length > 0 &&
      value.length < 6 &&
      !isInvalid;

    const showMatchHelper =
      field === 'confirmPassword' &&
      value.length > 0 &&
      value !== password &&
      !isInvalid;

    return (
      <FormControl size="md" isInvalid={isInvalid} style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText style={styles.labelText}>
            {t(translationKey)} <Text style={styles.requiredStar}>*</Text>
          </FormControlLabelText>
        </FormControlLabel>

        <Input
          variant="rounded"
          size="xl"
          style={[
            styles.input,
            focusedInput === field && styles.inputFocused,
            isInvalid && styles.inputError,
          ]}
        >
          <InputField
            type={passwordVisibility[field] ? 'text' : 'password'}
            placeholder={t(translationKey)}
            value={value}
            onChangeText={setValue}
            style={styles.inputField}
            onFocus={() => setFocusedInput(field)}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
          />
          <InputSlot
            onPress={() => togglePasswordVisibility(field)}
            style={styles.inputSlot}
          >
            <InputIcon
              as={passwordVisibility[field] ? EyeIcon : EyeOffIcon}
              color={separatorColor}
            />
          </InputSlot>
        </Input>

        {showHelper && (
          <FormControlHelper>
            <FormControlHelperText style={styles.helperText}>
              {t('password-requirement') || 'Must be at least 6 characters'}
            </FormControlHelperText>
          </FormControlHelper>
        )}

        {showMatchHelper && (
          <FormControlHelper>
            <FormControlHelperText
              style={[styles.helperText, { color: warningColor }]}
            >
              {t('noMatchingPasswords') || 'Passwords do not match'}
            </FormControlHelperText>
          </FormControlHelper>
        )}

        {isInvalid && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText style={styles.errorText}>
              {field === 'password'
                ? t('password-too-short') ||
                  'Password must be at least 6 characters'
                : t('noMatchingPasswords') || 'Passwords do not match'}
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel={t('go-back') as string}
            >
              <FontAwesomeIcon
                icon={Icons.faChevronLeft}
                size={24}
                color={'white'}
              />
            </TouchableOpacity>

            {/* Icon */}
            <Center style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <FontAwesomeIcon
                  icon={Icons.faLock}
                  size={48}
                  color={primaryColor}
                />
              </View>
            </Center>

            {/* Title */}
            <Center style={styles.titleContainer}>
              <Text style={styles.title}>
                {t('reset-password') || 'Reset Password'}
              </Text>
              <Text style={styles.subtitle}>
                {t('reset-password-desc') || 'Enter your new password below'}
              </Text>
            </Center>

            {/* Form Card */}
            <View style={styles.card}>
              <VStack space="lg">
                {renderPasswordInput('password', 'new-password')}
                {renderPasswordInput('confirmPassword', 'confirm-password')}

                <Center>
                  <Button
                    variant="solid"
                    size="lg"
                    style={[
                      styles.submitButton,
                      !isFormValid && styles.buttonDisabled,
                    ]}
                    onPress={handleResetPassword}
                    isDisabled={!isFormValid || loading}
                  >
                    {!loading && (
                      <ButtonText style={styles.submitButtonText}>
                        {t('reset-password') || 'Reset Password'}
                      </ButtonText>
                    )}
                    {loading && <ButtonSpinner />}
                  </Button>
                </Center>
              </VStack>
            </View>

            {/* Back to Login Link */}
            <Center style={styles.linkContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>
                  {t('remember-password') || 'Remember your password?'}{' '}
                  <Text style={styles.linkTextBold}>{t('login')}</Text>
                </Text>
              </TouchableOpacity>
            </Center>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020213',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    paddingLeft: 4,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${primaryColor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${primaryColor}30`,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  card: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 24,
  },
  formControl: {
    marginBottom: 16,
  },
  labelText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  requiredStar: {
    color: warningColor,
    fontSize: 16,
  },
  input: {
    backgroundColor: primaryBgColor,
    borderColor: '#333',
    borderWidth: 1,
  },
  inputFocused: {
    borderColor: primaryColor,
    borderWidth: 2,
  },
  inputError: {
    borderColor: warningColor,
    borderWidth: 2,
  },
  inputField: {
    color: primaryTextColor,
    fontSize: 16,
  },
  inputSlot: {
    paddingRight: 16,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    color: secondaryTextColor,
    fontSize: 12,
  },
  errorText: {
    color: warningColor,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 280,
    height: 54,
    shadowColor: primaryColor,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkContainer: {
    marginTop: 16,
  },
  linkText: {
    color: secondaryTextColor,
    fontSize: 14,
    textAlign: 'center',
  },
  linkTextBold: {
    color: primaryColor,
    fontWeight: '600',
  },
});

export default ResetPassword;
