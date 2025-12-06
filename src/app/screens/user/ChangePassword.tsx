import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  separatorColor,
  warningColor,
} from '../../utils/styles/colors';
import { useThemeColors } from '../../utils/styles/themeColors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
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
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import LoadingIndicator from '@/src/app/components/user/NewsFeed/LoadingIndicator';
import { Button, ButtonText } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { useChangePasswordAPI } from '../../hooks/useChangePasswordAPI';
import { Text } from '@/components/ui/text';
import { buttonStyles } from '../../utils/styles/buttonStyles';

type InputField = 'oldPassword' | 'newPassword' | 'confirmPassword';

export const PasswordChangeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const colors = useThemeColors();
  const [focusedInput, setFocusedInput] = useState<InputField | null>(null);

  const {
    formData,
    loading,
    passwordVisibility,
    updateField,
    togglePasswordVisibility,
    isPasswordValid,
    passwordsMatch,
    isFormValid,
    updatePassword,
  } = useChangePasswordAPI(t);

  const handleChangePassword = async () => {
    const result = await updatePassword();

    if (result.success) {
      showSuccessToast(
        t('password-changed-success') || 'Password Changed!',
        t('password-changed-success-description') ||
          'Your password has been updated successfully.'
      );
      navigation.goBack();
    } else {
      showErrorToast(
        t('password-change-error') || 'Error',
        result.error || t('password-change-error-description')
      );
    }
  };

  const renderPasswordInput = (
    field: keyof typeof formData,
    translationKey: string,
    showOldPasswordField: boolean = true
  ) => {
    if (!showOldPasswordField && field === 'oldPassword') return null;

    const isInvalid =
      (field === 'newPassword' &&
        formData.newPassword.length > 0 &&
        !isPasswordValid) ||
      (field === 'confirmPassword' &&
        formData.confirmPassword.length > 0 &&
        !passwordsMatch);

    const showHelper =
      field === 'newPassword' &&
      formData.newPassword.length > 0 &&
      formData.newPassword.length < 6 &&
      !isInvalid;

    const showMatchHelper =
      field === 'confirmPassword' &&
      formData.confirmPassword.length > 0 &&
      formData.confirmPassword !== formData.newPassword &&
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
            {
              backgroundColor: colors.primaryTextColor + '0D',
              borderColor: colors.separatorColor,
            },
            focusedInput === field && styles.inputFocused,
            isInvalid && styles.inputError,
          ]}
        >
          <InputField
            type={passwordVisibility[field] ? 'text' : 'password'}
            placeholder={t(translationKey)}
            placeholderTextColor={colors.secondaryTextColor}
            value={formData[field]}
            onChangeText={text => updateField(field, text)}
            style={[styles.inputField, { color: colors.primaryTextColor }]}
            onFocus={() => setFocusedInput(field)}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
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
              {field === 'newPassword'
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
              {t('change-password-title') || 'Change Password'}
            </Heading>
            <Text style={styles.subtitle}>
              {t('change-password-subtitle') ||
                'Update your password to keep your account secure'}
            </Text>
          </Center>

          {/* Form */}
          <VStack space="lg" style={styles.formContainer}>
            <View
              style={[
                styles.formWrapper,
                {
                  backgroundColor: colors.postBgColor,
                  borderColor: colors.separatorColor,
                },
              ]}
            >
              <VStack space="md">
                {renderPasswordInput('oldPassword', 'old-password')}
                {renderPasswordInput('newPassword', 'new-password')}
                {renderPasswordInput('confirmPassword', 'confirm-password')}
              </VStack>
            </View>

            {/* Submit Button */}
            <Button
              variant="solid"
              size="lg"
              style={[
                buttonStyles.primary,
                !isFormValid() && buttonStyles.primaryDisabled,
              ]}
              onPress={handleChangePassword}
              isDisabled={!isFormValid() || loading}
            >
              {loading ? (
                <LoadingIndicator />
              ) : (
                <ButtonText style={buttonStyles.primaryText}>
                  {t('change-password') || 'Change Password'}
                </ButtonText>
              )}
            </Button>
          </VStack>
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
    color: secondaryTextColor,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Form
  formContainer: {
    flex: 1,
  },
  formWrapper: {
    // backgroundColor and borderColor are set inline to use theme colors
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    // backgroundColor and borderColor are set inline to use theme colors
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
    // color is set inline to use theme colors
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
});
