import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
import Svg, { Path } from 'react-native-svg';
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
        {/* Background SVG */}
        <Svg
          style={{
            position: 'absolute',
            left: 0,
            top: 125,
          }}
          width="390"
          height="379"
          viewBox="0 0 390 379"
          fill="none"
        >
          <Path
            d="M340.897 8.988L279.707 49.9378V184.304L243.7 169.88L217.496 186.38V52.9053L185.401 20.5505L90.2854 0L54.7047 31.7905V118.668L17.771 106.274L0 121.046V127.228L15.7241 114.154V200.517L20.0333 203.429V112.274L54.7047 123.907V306.615L59.0139 309.522V34.2793L88.6781 7.77885V375.123L92.9872 378.035V5.70819L181.092 24.7422V356.391L185.401 353.479V27.2008L213.187 55.2127V310.02L217.496 307.113V192.103L241.739 176.838V288.13L246.048 285.223V176.153L279.707 189.62V333.392L284.016 336.309V52.6836L338.786 16.4746V370.15L343.095 367.238V16.2026L390 45.7814V40.0127L340.897 8.988Z"
            fill="#031824"
          />
        </Svg>
        <Svg
          style={{
            position: 'absolute',
            left: '50%',
            top: 75,
          }}
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
        >
          <Path
            d="M30 60C46.5406 60 60 46.5406 60 30C60 13.4594 46.5406 0 30 0C13.4594 0 0 13.4594 0 30C0 46.5406 13.4594 60 30 60ZM30 3.87097C44.4077 3.87097 56.129 15.5923 56.129 30C56.129 44.4077 44.4077 56.129 30 56.129C15.5923 56.129 3.87097 44.4077 3.87097 30C3.87097 15.5923 15.5923 3.87097 30 3.87097Z"
            fill="#031824"
          />
        </Svg>

        <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.mainContent}>
          <View style={styles.authPageContainer}>
            {/* Logo */}
            <Center style={styles.logoContainer}>
              <Svg width="348" height="90" viewBox="0 0 348 90" fill="none">
                <Path
                  d="M35.2971 84.4969L35.297 90.0009L0.225006 90L0.22514 84.496L35.2971 84.4969ZM125.718 84.4991L125.718 90.0031L35.35 90.0009L35.3501 84.4969L47.7661 84.4972L47.7682 0.529183L82.5842 0.530033C88.6429 0.530181 93.8482 1.25564 98.2001 2.70642C102.637 4.15719 105.923 6.11994 108.056 8.59466C112.152 13.2028 114.2 18.4081 114.2 24.2108C114.199 31.2081 111.981 36.4134 107.543 39.8266C105.922 41.0213 104.813 41.7892 104.215 42.1306C103.618 42.3866 102.551 42.8559 101.015 43.5385C106.562 44.7333 110.956 47.2507 114.199 51.0908C117.527 54.8456 119.191 59.5389 119.191 65.1709C119.19 73.6189 115.862 80.0615 109.206 84.4987L125.718 84.4991ZM62.8703 76.0496L86.5503 76.0501C92.097 76.0503 96.321 75.197 99.2224 73.4904C102.209 71.6985 103.703 68.3706 103.703 63.5066C103.703 55.5706 97.3456 51.6024 84.6309 51.6021L62.8709 51.6016L62.8703 76.0496ZM62.8713 37.6496L82.0713 37.65C92.994 37.6503 98.4554 33.9384 98.4556 26.5144C98.4557 22.2478 97.1331 19.1757 94.4878 17.2983C91.8425 15.4209 87.7465 14.4822 82.1999 14.482L62.8719 14.4816L62.8713 37.6496ZM232.117 84.5017L232.117 90.0057L203.573 90.005L194.614 69.6528L149.814 69.6517L140.853 90.0035L112.309 90.0028L112.309 84.4988L127.157 84.4991L164.151 0.532025L180.279 0.532419L217.269 84.5013L232.117 84.5017ZM188.47 55.7006L172.215 18.8362L155.958 55.6998L188.47 55.7006ZM316.109 84.5037L316.109 90.0077L288.461 90.0071L267.086 59.9265L247.246 59.9261L247.245 90.0061L219.725 90.0054L219.725 84.5014L232.141 84.5017L232.143 0.533685L265.423 0.534498C279.077 0.534831 288.847 2.83907 294.735 7.44722C300.623 12.0554 303.567 19.4368 303.566 29.5914C303.566 44.3541 297.123 53.6553 284.238 57.495L303.693 84.5034L316.109 84.5037ZM266.062 46.2305C274.595 46.2307 280.398 44.9082 283.47 42.2629C286.542 39.6177 288.078 35.3937 288.078 29.5911C288.079 23.7031 286.5 19.6924 283.343 17.5589C280.185 15.3402 274.554 14.2307 266.447 14.2305L247.247 14.2301L247.246 46.2301L266.062 46.2305ZM347.922 84.5045L347.922 90.0085L312.85 90.0077L312.85 84.5037L347.922 84.5045Z"
                  fill="white"
                />
              </Svg>
            </Center>

            {/* BarHub Text Logo */}
            <Center style={styles.subLogoContainer}>
              <Svg width="146" height="45" viewBox="0 0 146 45" fill="none">
                <Path
                  d="M50.6968 42.248V45H36.9368V26.696H14.7288V45H7.17675V0.263996H14.7288V19.656H36.9368V0.263996H44.4888V42.248H50.6968ZM7.17675 42.248H0.96875V45H7.17675V42.248ZM99.8708 42.248V45H50.7188V42.248H63.9668C58.8894 38.7067 56.3508 33.096 56.3508 25.416V0.263996H63.9028V25.096C63.9028 29.192 64.9268 32.4347 66.9748 34.824C69.0228 37.2133 71.7961 38.408 75.2948 38.408C78.7934 38.408 81.5668 37.2133 83.6147 34.824C85.6628 32.4347 86.6868 29.192 86.6868 25.096V0.263996H94.2388V25.416C94.2388 33.1387 91.6788 38.7493 86.5588 42.248H99.8708ZM145.028 42.248V45H99.8438V42.248H106.052V0.263996H123.46C126.489 0.263996 129.092 0.626663 131.268 1.352C133.486 2.07733 135.129 3.05866 136.196 4.296C138.244 6.6 139.268 9.20267 139.268 12.104C139.268 15.6027 138.158 18.2053 135.94 19.912C135.129 20.5093 134.574 20.8933 134.276 21.064C133.977 21.192 133.444 21.4267 132.676 21.768C135.449 22.3653 137.646 23.624 139.268 25.544C140.932 27.4213 141.764 29.768 141.764 32.584C141.764 36.808 140.1 40.0293 136.772 42.248H145.028ZM113.604 38.024H125.444C128.217 38.024 130.329 37.5973 131.78 36.744C133.273 35.848 134.02 34.184 134.02 31.752C134.02 27.784 130.841 25.8 124.484 25.8H113.604V38.024ZM113.604 18.824H123.204C128.665 18.824 131.396 16.968 131.396 13.256C131.396 11.1227 130.734 9.58667 129.412 8.648C128.089 7.70933 126.041 7.24 123.268 7.24H113.604V18.824Z"
                  fill="#10D9B9"
                />
              </Svg>
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
        </View>
        </KeyboardAvoidingView>
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
    marginBottom: 8,
  },
  subLogoContainer: {
    marginBottom: 16,
  },
  welcomeContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
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
