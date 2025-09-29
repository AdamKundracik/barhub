import {
  StyleSheet,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { formStyles } from '../../utils/styles/styles';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
  postBgColor,
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
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Divider } from '@/components/ui/divider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Icons from '@fortawesome/free-solid-svg-icons';
import { useForgotPassword } from '../../hooks/useForgotPassword';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { AlertCircleIcon } from '@/components/ui/icon';

type InputFieldType = 'email';

export const ForgotPassword = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [focusedInput, setFocusedInput] = useState<InputFieldType | null>(null);
  
  const {
    email,
    setEmail,
    loading,
    emailSent,
    isValidEmail,
    isFormValid,
    sendResetEmail,
    resetForm,
  } = useForgotPassword(t);

  const handleSendResetEmail = async () => {
    const result = await sendResetEmail();
    
    if (result.success) {
      showSuccessToast(
        t('reset-email-sent') || 'Reset email sent!',
        t('reset-email-sent-desc') || 'Check your inbox for password reset instructions.'
      );
    } else {
      showErrorToast(
        t('error'),
        result.error || t('something-went-wrong')
      );
    }
  };

  const handleTryAgain = () => {
    resetForm();
  };

  if (emailSent) {
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
          {/* Success Icon */}
          <Center style={styles.iconContainer}>
            <View style={styles.successIconCircle}>
              <FontAwesomeIcon
                icon={Icons.faCheckCircle}
                size={64}
                color={primaryColor}
              />
            </View>
          </Center>

          {/* Success Card */}
          <View style={styles.card}>
            <VStack space="lg">
              <Center>
                <Text style={styles.successTitle}>
                  {t('reset-email-sent') || 'Email Sent!'}
                </Text>
              </Center>

              <View style={styles.emailBox}>
                <Text style={styles.emailLabel}>
                  {t('reset-email-sent-to') || 'We sent password reset instructions to:'}
                </Text>
                <Text style={styles.emailText}>{email}</Text>
              </View>

              <Divider style={styles.divider} />

              <VStack space="md">
                <HStack space="sm" style={styles.instructionRow}>
                  <FontAwesomeIcon
                    icon={Icons.faEnvelope}
                    size={20}
                    color={primaryColor}
                  />
                  <Text style={styles.instructionText}>
                    {t('check-inbox-reset') || 'Check your inbox for the reset link'}
                  </Text>
                </HStack>

                <HStack space="sm" style={styles.instructionRow}>
                  <FontAwesomeIcon
                    icon={Icons.faClock}
                    size={20}
                    color={secondaryTextColor}
                  />
                  <Text style={styles.instructionText}>
                    {t('reset-link-expires') || 'Link expires in 1 hour'}
                  </Text>
                </HStack>

                <HStack space="sm" style={styles.instructionRow}>
                  <FontAwesomeIcon
                    icon={Icons.faCircleExclamation}
                    size={20}
                    color={warningColor}
                  />
                  <Text style={styles.instructionText}>
                    {t('check-spam')}
                  </Text>
                </HStack>
              </VStack>

              <Divider style={styles.divider} />

              <Center>
                <Button
                  variant="outline"
                  size="lg"
                  style={styles.secondaryButton}
                  onPress={handleTryAgain}
                >
                  <HStack space="sm" style={styles.buttonContent}>
                    <FontAwesomeIcon
                      icon={Icons.faRotateLeft}
                      size={16}
                      color={primaryColor}
                    />
                    <ButtonText style={styles.secondaryButtonText}>
                      {t('try-different-email') || 'Try different email'}
                    </ButtonText>
                  </HStack>
                </Button>
              </Center>
            </VStack>
          </View>

          {/* Back to Login Button */}
          <Button
            variant="solid"
            size="lg"
            style={styles.backToLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <HStack space="sm" style={styles.buttonContent}>
              <FontAwesomeIcon
                icon={Icons.faArrowLeft}
                size={16}
                color={'#000'}
              />
              <ButtonText style={styles.backToLoginButtonText}>
                {t('back-to-login') || 'Back to Login'}
              </ButtonText>
            </HStack>
          </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
          <FontAwesomeIcon icon={Icons.faChevronLeft} size={24} color={'white'} />
        </TouchableOpacity>

        {/* Icon */}
        <Center style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <FontAwesomeIcon
              icon={Icons.faKey}
              size={48}
              color={primaryColor}
            />
          </View>
        </Center>

        {/* Title */}
        <Center style={styles.titleContainer}>
          <Text style={styles.title}>{t('forgot-password')}</Text>
          <Text style={styles.subtitle}>
            {t('forgot-password-desc') || 'Enter your email and we\'ll send you a link to reset your password'}
          </Text>
        </Center>

        {/* Form Card */}
        <View style={styles.card}>
          <VStack space="lg">
            <FormControl
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={true}
              style={styles.formControl}
              isInvalid={email.length > 0 && !isValidEmail(email)}
            >
              <FormControlLabel>
                <FormControlLabelText style={styles.labelText}>
                  {t('email')} <Text style={styles.requiredStar}>*</Text>
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                className="my-1"
                variant="rounded"
                size="xl"
                style={[
                  formStyles.inputPrimary,
                  focusedInput === 'email' && styles.inputFocused,
                ]}
              >
                <InputField
                  type="text"
                  keyboardType="email-address"
                  placeholder={t('email')}
                  style={{ color: primaryTextColor }}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Input>
              {email.length === 0 && (
                <FormControlHelper>
                  <FormControlHelperText style={styles.helperText}>
                    {t('enter-valid-email')}
                  </FormControlHelperText>
                </FormControlHelper>
              )}
              {email.length > 0 && !isValidEmail(email) && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                  <FormControlErrorText className="text-red-500">
                    {t('invalid-email')}
                  </FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Center>
              <Button
                variant="solid"
                size="lg"
                style={[
                  styles.submitButton,
                  !isFormValid() && styles.buttonDisabled,
                ]}
                onPress={handleSendResetEmail}
                isDisabled={!isFormValid() || loading}
              >
                {!loading && (
                  <ButtonText style={styles.submitButtonText}>
                    {t('send-reset-link') || t('resetPassword')}
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
  successIconCircle: {
    marginBottom: 16,
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
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  labelText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '500',
  },
  requiredStar: {
    color: warningColor,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: primaryColor,
    borderWidth: 2,
    shadowColor: primaryColor,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  helperText: {
    color: secondaryTextColor,
    fontSize: 12,
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
  emailBox: {
    backgroundColor: `${primaryColor}10`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${primaryColor}30`,
  },
  emailLabel: {
    fontSize: 14,
    color: secondaryTextColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryColor,
    textAlign: 'center',
  },
  divider: {
    backgroundColor: primaryColor,
    opacity: 0.2,
    marginVertical: 8,
  },
  instructionRow: {
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  instructionText: {
    fontSize: 14,
    color: primaryTextColor,
    flex: 1,
    lineHeight: 20,
  },
  secondaryButton: {
    borderColor: primaryColor,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 250,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    paddingHorizontal: 24,
    shadowColor: primaryColor,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backToLoginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
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

export default ForgotPassword;