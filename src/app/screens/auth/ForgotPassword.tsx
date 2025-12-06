import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { getFormStyles } from '../../utils/styles/styles';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../utils/styles/themeColors';
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
import { useForgotPasswordAPI } from '../../hooks/useForgotPasswordAPI';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { AlertCircleIcon } from '@/components/ui/icon';

type InputFieldType = 'email';

export const ForgotPassword = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const colors = useThemeColors();
  const themeFormStyles = getFormStyles(colors);
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
  } = useForgotPasswordAPI(t);

  const handleSendResetEmail = async () => {
    const result = await sendResetEmail();

    if (result.success) {
      showSuccessToast(
        t('reset-email-sent') || 'Reset email sent!',
        t('reset-email-sent-desc') ||
          'Check your inbox for password reset instructions.'
      );
    } else {
      showErrorToast(t('error'), result.error || t('something-went-wrong'));
    }
  };

  const handleTryAgain = () => {
    resetForm();
  };

  if (emailSent) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.primaryBgColor }]}
      >
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
                    color={colors.primaryColor}
                  />
                </View>
              </Center>

              {/* Success Card */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.postBgColor,
                    borderColor: colors.separatorColor,
                  },
                ]}
              >
                <VStack space="lg">
                  <Center>
                    <Text
                      style={[
                        styles.successTitle,
                        { color: colors.primaryTextColor },
                      ]}
                    >
                      {t('reset-email-sent') || 'Email Sent!'}
                    </Text>
                  </Center>

                  <View style={styles.emailBox}>
                    <Text
                      style={[
                        styles.emailLabel,
                        { color: colors.secondaryTextColor },
                      ]}
                    >
                      {t('reset-email-sent-to') ||
                        'We sent password reset instructions to:'}
                    </Text>
                    <Text
                      style={[styles.emailText, { color: colors.primaryColor }]}
                    >
                      {email}
                    </Text>
                  </View>

                  <Divider style={styles.divider} />

                  <VStack space="md">
                    <HStack space="sm" style={styles.instructionRow}>
                      <FontAwesomeIcon
                        icon={Icons.faEnvelope}
                        size={20}
                        color={colors.primaryColor}
                      />
                      <Text
                        style={[
                          styles.instructionText,
                          { color: colors.primaryTextColor },
                        ]}
                      >
                        {t('check-inbox-reset') ||
                          'Check your inbox for the reset link'}
                      </Text>
                    </HStack>

                    <HStack space="sm" style={styles.instructionRow}>
                      <FontAwesomeIcon
                        icon={Icons.faClock}
                        size={20}
                        color={colors.secondaryTextColor}
                      />
                      <Text
                        style={[
                          styles.instructionText,
                          { color: colors.primaryTextColor },
                        ]}
                      >
                        {t('reset-link-expires') || 'Link expires in 1 hour'}
                      </Text>
                    </HStack>

                    <HStack space="sm" style={styles.instructionRow}>
                      <FontAwesomeIcon
                        icon={Icons.faCircleExclamation}
                        size={20}
                        color={colors.warningColor}
                      />
                      <Text
                        style={[
                          styles.instructionText,
                          { color: colors.primaryTextColor },
                        ]}
                      >
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
                          color={colors.primaryColor}
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
                    color={colors.primaryBgColor}
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
              <FontAwesomeIcon
                icon={Icons.faChevronLeft}
                size={24}
                color={colors.primaryTextColor}
              />
            </TouchableOpacity>

            {/* Icon */}
            <Center style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <FontAwesomeIcon
                  icon={Icons.faKey}
                  size={48}
                  color={colors.primaryColor}
                />
              </View>
            </Center>

            {/* Title */}
            <Center style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.primaryTextColor }]}>
                {t('forgot-password')}
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.secondaryTextColor }]}
              >
                {t('forgot-password-desc') ||
                  "Enter your email and we'll send you a link to reset your password"}
              </Text>
            </Center>

            {/* Form Card */}
            <View style={styles.card}>
              <VStack space="lg">
                <FormControl
                  size="md"
                  isDisabled={false}
                  isReadOnly={false}
                  isRequired={false}
                  style={styles.formControl}
                  isInvalid={email.length > 0 && !isValidEmail(email)}
                >
                  <FormControlLabel>
                    <FormControlLabelText
                      style={[styles.labelText, { color: colors.primaryColor }]}
                    >
                      {t('email')}{' '}
                      <Text
                        style={[
                          styles.requiredStar,
                          { color: colors.warningColor },
                        ]}
                      >
                        *
                      </Text>
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input
                    className="my-1"
                    variant="rounded"
                    size="xl"
                    style={[
                      themeFormStyles.inputPrimary,
                      focusedInput === 'email' && {
                        borderColor: colors.primaryColor,
                        borderWidth: 2,
                        shadowColor: colors.primaryColor,
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 2,
                      },
                    ]}
                  >
                    <InputField
                      type="text"
                      keyboardType="email-address"
                      placeholder={t('email')}
                      placeholderTextColor={colors.secondaryTextColor}
                      style={{ color: colors.primaryTextColor }}
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
                      <FormControlHelperText
                        style={[
                          styles.helperText,
                          { color: colors.secondaryTextColor },
                        ]}
                      >
                        {t('enter-valid-email')}
                      </FormControlHelperText>
                    </FormControlHelper>
                  )}
                  {email.length > 0 && !isValidEmail(email) && (
                    <FormControlError>
                      <FormControlErrorIcon
                        as={AlertCircleIcon}
                        className="text-red-500"
                      />
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
                      <ButtonText
                        style={[
                          styles.submitButtonText,
                          { color: colors.primaryBgColor },
                        ]}
                      >
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
                <Text
                  style={[
                    styles.linkText,
                    { color: colors.secondaryTextColor },
                  ]}
                >
                  {t('remember-password') || 'Remember your password?'}{' '}
                  <Text
                    style={[
                      styles.linkTextBold,
                      { color: colors.primaryColor },
                    ]}
                  >
                    {t('login')}
                  </Text>
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
    // backgroundColor is set inline to use theme colors
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
    backgroundColor: '#10D9B915', // Static color for StyleSheet
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10D9B930', // Static color for StyleSheet
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
    // color is set inline to use theme colors
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 16,
    // color is set inline to use theme colors
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    // color is set inline to use theme colors
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    // backgroundColor is set inline to use theme colors
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    // borderColor is set inline to use theme colors
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
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  requiredStar: {
    // color is set inline to use theme colors
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#10D9B9', // Static color for StyleSheet
    borderWidth: 2,
  },
  helperText: {
    // color is set inline to use theme colors
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#10D9B9', // Static color for StyleSheet
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 280,
    height: 54,
    shadowColor: '#10D9B9', // Static color for StyleSheet
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emailBox: {
    backgroundColor: '#10D9B910', // Static color for StyleSheet
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10D9B930', // Static color for StyleSheet
  },
  emailLabel: {
    fontSize: 14,
    // color is set inline to use theme colors
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    // color is set inline to use theme colors
    textAlign: 'center',
  },
  divider: {
    backgroundColor: '#10D9B9', // Static color for StyleSheet
    opacity: 0.2,
    marginVertical: 8,
  },
  instructionRow: {
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  instructionText: {
    fontSize: 14,
    // color is set inline to use theme colors
    flex: 1,
    lineHeight: 20,
  },
  secondaryButton: {
    borderColor: '#10D9B9', // Static color for StyleSheet
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
    color: '#10D9B9', // Static color for StyleSheet
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    backgroundColor: '#10D9B9', // Static color for StyleSheet
    borderRadius: 12,
    paddingHorizontal: 24,
    shadowColor: '#10D9B9', // Static color for StyleSheet
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backToLoginButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '700',
  },
  linkContainer: {
    marginTop: 16,
  },
  linkText: {
    // color is set inline to use theme colors
    fontSize: 14,
    textAlign: 'center',
  },
  linkTextBold: {
    // color is set inline to use theme colors
    fontWeight: '600',
  },
});

export default ForgotPassword;
