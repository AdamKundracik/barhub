import {
  Image,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as React from 'react';
import { useState } from 'react';
import { AppleButton } from '@invertase/react-native-apple-authentication';
import { formStyles } from '../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { GoogleIcon } from '../../utils/icons/GoogleIcon';
import OSeparator from '../../components/auth/OSeparator';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
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
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';
import { Center } from '@/components/ui/center';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { useLoginForm } from '../../hooks/useLoginForm';
import { useCustomToast } from '../../components/shared/Toaster';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export const LogIn = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { showErrorToast } = useCustomToast();
  const [togglePassword, setTogglePassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const {
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
  } = useLoginForm();

  const onSignIn = async () => {
    const result = await handleEmailPasswordSignIn();
    if (!result.success && result.error) {
      showErrorToast(t('error') || 'Error', result.error);
    }
  };

  const onAppleButtonPress = async () => {
    const result = await handleAppleSignIn();
    if (!result.success && result.error) {
      showErrorToast(t('error') || 'Error', result.error);
    }
  };

  const onGoogleButtonPress = async () => {
    const result = await handleGoogleSignIn();
    if (!result.success && result.error) {
      showErrorToast(t('error') || 'Error', result.error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.wrapper}>
        {/* Gradient line background */}
        <Svg
          style={StyleSheet.absoluteFillObject}
          viewBox="0 0 397 860"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            <LinearGradient id="grad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#CC2ECC" />
              <Stop offset="50%" stopColor="#FF4E8A" />
              <Stop offset="100%" stopColor="#FF9A5C" />
            </LinearGradient>
            <LinearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF9A5C" />
              <Stop offset="50%" stopColor="#FF4E8A" />
              <Stop offset="100%" stopColor="#CC2ECC" />
            </LinearGradient>
          </Defs>

          {/* Top-left arc */}
          <Path
            d="M -30 220 Q 150 250 300 -30"
            stroke="url(#grad1)"
            strokeWidth={40}
            strokeLinecap="round"
            fill="none"
          />

          {/* Bottom-right arc */}
          <Path
            d="M 100 890 Q 250 610 430 640"
            stroke="url(#grad2)"
            strokeWidth={40}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>

        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.mainContent}
          keyboardShouldPersistTaps="handled"
          bottomOffset={16}
        >
          <View style={styles.authPageContainer}>
            {/* Logo */}
            <Center style={[styles.logoContainer]}>
              <Image
                source={require('../../../../assets/logo.png')}
                style={{ width: 233, height: 134, resizeMode: 'contain' }}
              />
            </Center>

            {/*/!* Welcome Text *!/*/}
            {/*<View style={styles.welcomeContainer}>*/}
            {/*  <Text style={styles.welcomeSubtitle}>*/}
            {/*    {t('sign-in-to-continue') ||*/}
            {/*      'Sign in to your account to continue'}*/}
            {/*  </Text>*/}
            {/*</View>*/}

            {/* Email Input */}
            <FormControl
              size="md"
              isDisabled={false}
              isReadOnly={false}
              style={styles.formControl}
              isInvalid={touched.email && !!errors.email}
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
                  placeholder={t('email')}
                  style={{ color: primaryTextColor }}
                  onChangeText={value => updateField('email', value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('email');
                  }}
                  value={formData.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </Input>
              {touched.email && errors.email && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{errors.email}</FormControlErrorText>
                </FormControlError>
              )}
              {formData.email.length > 0 &&
                !errors.email &&
                !isValidEmail(formData.email) && (
                  <FormControlHelper>
                    <FormControlHelperText style={styles.warningText}>
                      {t('enter-valid-email') || 'Please enter a valid email'}
                    </FormControlHelperText>
                  </FormControlHelper>
                )}
            </FormControl>

            {/* Password Input */}
            <FormControl
              size="md"
              isDisabled={false}
              isReadOnly={false}
              style={styles.formControl}
              isInvalid={touched.password && !!errors.password}
            >
              <FormControlLabel>
                <FormControlLabelText style={styles.labelText}>
                  {t('password')} <Text style={styles.requiredStar}>*</Text>
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                className="my-1"
                variant="rounded"
                size="xl"
                style={[
                  formStyles.inputPrimary,
                  focusedInput === 'password' && styles.inputFocused,
                ]}
              >
                <InputField
                  type={togglePassword ? 'text' : 'password'}
                  placeholder={t('password')}
                  style={{ color: primaryTextColor }}
                  onChangeText={value => updateField('password', value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('password');
                  }}
                  value={formData.password}
                />
                <InputSlot
                  className="pr-3"
                  onPress={() => setTogglePassword(!togglePassword)}
                >
                  <InputIcon as={togglePassword ? EyeIcon : EyeOffIcon} />
                </InputSlot>
              </Input>
              {touched.password && errors.password && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{errors.password}</FormControlErrorText>
                </FormControlError>
              )}
              {formData.password.length > 0 &&
                formData.password.length < 8 &&
                !errors.password && (
                  <FormControlHelper>
                    <FormControlHelperText style={styles.warningText}>
                      {t('password-min-length') || 'Minimum 8 characters'}
                    </FormControlHelperText>
                  </FormControlHelper>
                )}
            </FormControl>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>
                {t('forgotPassword') || 'Forgot Password?'}
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              variant="solid"
              size="lg"
              style={styles.signInButton}
              onPress={onSignIn}
              isDisabled={loading}
            >
              {!loading && (
                <ButtonText style={styles.signInButtonText}>
                  {t('login')}
                </ButtonText>
              )}
              {loading && <ButtonSpinner />}
            </Button>

            {/* Separator */}
            <OSeparator />

            {/* Social Sign In Buttons */}
            <View style={styles.socialButtonsContainer}>
              <AppleButton
                buttonStyle={AppleButton.Style.WHITE}
                buttonType={AppleButton.Type.SIGN_IN}
                style={styles.socialButton}
                cornerRadius={10}
                onPress={onAppleButtonPress}
              />

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={onGoogleButtonPress}
                disabled={loading}
              >
                <GoogleIcon />
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <Center style={styles.registerContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}>
                  {t('noAccount') || "Don't have an account?"}{' '}
                  <Text style={styles.registerTextBold}>
                    {t('registerYourself') || 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Center>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#020213',
    padding: 15,
  },
  content: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
  },
  authPageContainer: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  logoContainer: {
    marginTop: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 36,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    lineHeight: 24,
  },
  formControl: {
    marginBottom: 10,
  },
  labelText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputFocused: {
    borderColor: primaryColor,
    borderWidth: 2,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 13,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    height: 50,
    marginBottom: 12,
  },
  signInButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  socialButtonsContainer: {
    width: '100%',
    marginBottom: 12,
  },
  socialButton: {
    width: '100%',
    marginVertical: 6,
    alignItems: 'center',
    height: 44,
  },
  registerContainer: {
    marginTop: 4,
  },
  registerText: {
    color: secondaryTextColor,
    fontSize: 14,
    textAlign: 'center',
  },
  registerTextBold: {
    color: primaryColor,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LogIn;
