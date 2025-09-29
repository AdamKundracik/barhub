import React, { useEffect, useState } from 'react';
import {
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  primaryTextColor,
  separatorColor,
  warningColor,
} from '../../utils/styles/colors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import LoadingIndicator from '@/src/app/components/user/NewsFeed/LoadingIndicator';
import { Button, ButtonText } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { KeyIcon } from 'lucide-react-native';

type LoginMethod = 'email' | 'google' | 'other';
type InputField = 'oldPassword' | 'password' | 'confirmPassword';

export const PasswordChangeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Form state
  const [formData, setFormData] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [focusedInput, setFocusedInput] = useState<InputField | null>(null);
  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: false,
    password: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  const auth = getAuth();
  const user = auth.currentUser;

  // Validation
  const isPasswordValid = formData.password.length >= 6;
  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.password !== '';
  const canSubmit =
    !loading &&
    isPasswordValid &&
    passwordsMatch &&
    loginMethod !== 'other' &&
    (loginMethod === 'google' || formData.oldPassword.length > 0);

  useEffect(() => {
    if (!user) return;

    const providers = user.providerData.map(p => p.providerId);
    if (providers.includes('google.com')) {
      setLoginMethod('google');
    } else if (providers.includes('password')) {
      setLoginMethod('email');
    } else {
      setLoginMethod('other');
    }
  }, [user]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof passwordVisibility) => {
    setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const reauthenticateAndChangePassword = async () => {
    if (!user || !canSubmit) return;

    setLoading(true);
    try {
      if (loginMethod === 'email' && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          formData.oldPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, formData.password);
      } else if (loginMethod === 'google') {
        const googleUser = await GoogleSignin.signIn();
        const googleCredential = GoogleAuthProvider.credential(
          googleUser.idToken
        );
        await reauthenticateWithCredential(user, googleCredential);

        const hasPassword = user.providerData.some(
          p => p.providerId === 'password'
        );
        if (!hasPassword && user.email) {
          const passwordCredential = EmailAuthProvider.credential(
            user.email,
            formData.password
          );
          await linkWithCredential(user, passwordCredential);
        } else {
          await updatePassword(user, formData.password);
        }
      }

      showSuccessToast(
        t('password-changed-success'),
        t('password-changed-success-description')
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error updating password:', error);
      showErrorToast(
        t('password-change-error'),
        t('password-change-error-description')
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    field: keyof typeof formData,
    icon: any,
    translationKey: string,
    showField: boolean = true
  ) => {
    if (!showField) return null;

    const isInvalid =
      (field === 'password' &&
        formData.password.length > 0 &&
        !isPasswordValid) ||
      (field === 'confirmPassword' &&
        formData.confirmPassword.length > 0 &&
        !passwordsMatch);

    return (
      <FormControl size="lg" isInvalid={isInvalid} style={styles.formControl}>
        <FormControlLabel>
          <HStack space="sm" style={styles.labelContainer}>
            <FormControlLabelText style={styles.labelText}>
              {t(translationKey)}
            </FormControlLabelText>
          </HStack>
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
            value={formData[field]}
            onChangeText={text => handleInputChange(field, text)}
            style={styles.inputField}
            onFocus={() => setFocusedInput(field)}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="none"
            autoCorrect={false}
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

        {isInvalid && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText style={styles.errorText}>
              {field === 'password'
                ? t('password-too-short')
                : t('noMatchingPasswords')}
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
    );
  };

  const renderUnsupportedMessage = () => (
    <Box style={styles.warningContainer}>
      <HStack space="md" style={styles.warningContent}>
        <InputIcon as={AlertCircleIcon} color={warningColor} size="lg" />
        <Text style={styles.warningText}>
          {t('password-change-not-supported')}
        </Text>
      </HStack>
    </Box>
  );

  return (
    <ScreenLayout onBackPress={() => navigation.goBack()} showBackButton>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Center style={styles.headerContainer}>
            <Box style={styles.headerIconContainer}>
              <FontAwesomeIcon
                icon={Icons.ShieldHalved}
                color={primaryColor}
                size={24}
              />
            </Box>
            <Heading size="2xl" style={styles.header}>
              {t('change-password-title')}
            </Heading>
          </Center>

          {loginMethod === 'other' ? (
            renderUnsupportedMessage()
          ) : (
            <VStack space="lg" style={styles.formContainer}>
              <View style={styles.formWrapper}>
                <VStack space="md">
                  {renderPasswordInput(
                    'oldPassword',
                    KeyIcon,
                    'old-password',
                    loginMethod === 'email'
                  )}
                  {renderPasswordInput(
                    'password',
                    Icons.Remove,
                    'new-password'
                  )}
                  {renderPasswordInput(
                    'confirmPassword',
                    Icons.Remove,
                    'confirm-password'
                  )}
                </VStack>
              </View>

              {/* Submit Button */}
              <Button
                variant="solid"
                size="lg"
                style={[
                  styles.submitButton,
                  !canSubmit && styles.submitButtonDisabled,
                ]}
                onPress={reauthenticateAndChangePassword}
                isDisabled={!canSubmit}
              >
                {loading ? (
                  <LoadingIndicator />
                ) : (
                  <ButtonText style={styles.submitButtonText}>
                    {loginMethod === 'google' &&
                    !user?.providerData.some(p => p.providerId === 'password')
                      ? t('setup-password')
                      : t('change-password')}
                  </ButtonText>
                )}
              </Button>
            </VStack>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  headerContainer: {
    marginBottom: 40,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${primaryColor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    color: primaryTextColor,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    color: separatorColor,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  formContainer: {
    flex: 1,
  },
  formWrapper: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formControl: {
    marginBottom: 6,
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 20,
    alignItems: 'center',
  },
  labelText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: primaryBgColor,
    borderColor: '#333',
    borderWidth: 1,
  },
  inputFocused: {
    borderColor: primaryColor,
    borderWidth: 2,
    shadowColor: primaryColor,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
  errorText: {
    color: warningColor,
    fontSize: 14,
  },

  // Warning
  warningContainer: {
    backgroundColor: `${warningColor}15`,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: `${warningColor}30`,
  },
  warningContent: {
    alignItems: 'center',
  },
  warningText: {
    color: warningColor,
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },

  // Submit Button
  submitButton: {
    backgroundColor: primaryColor,
    borderRadius: 16,
    shadowColor: primaryColor,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: separatorColor,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
});
