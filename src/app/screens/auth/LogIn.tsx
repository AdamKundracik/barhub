import {
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

        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.mainContent}
          keyboardShouldPersistTaps="handled"
          bottomOffset={16}
        >
          <View style={styles.authPageContainer}>
              {/* Logo */}
              <Center style={[styles.logoContainer]}>
                <Svg width="395" height="186" viewBox="0 0 395 186" fill="none">
                  <Path
                    d="M175.105 133.5V136.252H161.345V117.948H139.137V136.252H131.585V91.5159H139.137V110.908H161.345V91.5159H168.897V133.5H175.105ZM131.585 133.5H125.377V136.252H131.585V133.5ZM224.279 133.5V136.252H175.127V133.5H188.375C183.298 129.959 180.759 124.348 180.759 116.668V91.5159H188.311V116.348C188.311 120.444 189.335 123.687 191.383 126.076C193.431 128.465 196.205 129.66 199.703 129.66C203.202 129.66 205.975 128.465 208.023 126.076C210.071 123.687 211.095 120.444 211.095 116.348V91.5159H218.647V116.668C218.647 124.391 216.087 130.001 210.967 133.5H224.279ZM269.436 133.5V136.252H224.252V133.5H230.46V91.5159H247.868C250.898 91.5159 253.5 91.8786 255.676 92.604C257.895 93.3293 259.538 94.3106 260.604 95.548C262.652 97.852 263.676 100.455 263.676 103.356C263.676 106.855 262.567 109.457 260.348 111.164C259.538 111.761 258.983 112.145 258.684 112.316C258.386 112.444 257.852 112.679 257.084 113.02C259.858 113.617 262.055 114.876 263.676 116.796C265.34 118.673 266.172 121.02 266.172 123.836C266.172 128.06 264.508 131.281 261.18 133.5H269.436ZM238.012 129.276H249.852C252.626 129.276 254.738 128.849 256.188 127.996C257.682 127.1 258.428 125.436 258.428 123.004C258.428 119.036 255.25 117.052 248.892 117.052H238.012V129.276ZM238.012 110.076H247.612C253.074 110.076 255.804 108.22 255.804 104.508C255.804 102.375 255.143 100.839 253.82 99.9C252.498 98.9613 250.45 98.492 247.676 98.492H238.012V110.076Z"
                    fill="#10D9B9"
                  />
                  <Path
                    d="M58.6978 83.9689L58.6977 89.4729L23.6257 89.4722L23.6258 83.9682L58.6978 83.9689ZM149.119 83.9707L149.119 89.4747L58.7507 89.4729L58.7508 83.9689L71.1668 83.9691L71.1693 0.00109128L105.985 0.00178567C112.044 0.00190651 117.249 0.727344 121.601 2.1781C126.039 3.62886 129.324 5.59159 131.457 8.0663C135.553 12.6744 137.601 17.8798 137.601 23.6824C137.6 30.6798 135.382 35.885 130.944 39.2983C129.323 40.4929 128.213 41.2609 127.616 41.6022C127.019 41.8582 125.952 42.3275 124.416 43.0102C129.963 44.2049 134.357 46.7224 137.6 50.5624C140.928 54.3172 142.592 59.0105 142.591 64.6425C142.591 73.0905 139.263 79.5331 132.607 83.9703L149.119 83.9707ZM86.2711 75.5214L109.951 75.5219C115.498 75.522 119.722 74.6687 122.623 72.9621C125.61 71.1702 127.103 67.8422 127.103 62.9782C127.104 55.0422 120.746 51.0741 108.032 51.0738L86.2718 51.0734L86.2711 75.5214ZM86.2722 37.1214L105.472 37.1218C116.395 37.122 121.856 33.4101 121.857 25.9861C121.857 21.7194 120.534 18.6474 117.889 16.77C115.244 14.8926 111.148 13.9539 105.601 13.9538L86.2729 13.9534L86.2722 37.1214ZM255.518 83.9728L255.518 89.4768L226.974 89.4762L218.014 69.124L173.214 69.1231L164.254 89.475L135.71 89.4744L135.71 83.9704L150.558 83.9707L187.552 0.0034125L203.68 0.00373416L240.67 83.9725L255.518 83.9728ZM211.871 55.1719L195.616 18.3076L179.359 55.1713L211.871 55.1719ZM339.51 83.9745L339.51 89.4785L311.862 89.4779L290.487 59.3975L270.647 59.3971L270.646 89.4771L243.126 89.4765L243.126 83.9725L255.542 83.9728L255.544 0.00476857L288.824 0.00543233C302.478 0.00570464 312.248 2.3099 318.136 6.91802C324.024 11.5261 326.968 18.9075 326.967 29.0622C326.967 43.8249 320.524 53.1261 307.639 56.9658L327.094 83.9742L339.51 83.9745ZM289.463 45.7015C297.996 45.7016 303.799 44.3791 306.871 41.7338C309.943 39.0885 311.479 34.8646 311.479 29.0619C311.48 23.1739 309.901 19.1632 306.744 17.0298C303.587 14.8111 297.955 13.7016 289.848 13.7015L270.648 13.7011L270.647 45.7011L289.463 45.7015ZM371.323 83.9751L371.323 89.4791L336.251 89.4784L336.251 83.9744L371.323 83.9751Z"
                    fill="white"
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
                    <FormControlErrorText>
                      {errors.password}
                    </FormControlErrorText>
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
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                >
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
