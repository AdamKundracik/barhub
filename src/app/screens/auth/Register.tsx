import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthLayout from '../../components/auth/AuthLayout';
import * as React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Icons from '@fortawesome/free-solid-svg-icons';
import { formStyles } from '../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '../../utils/styles/colors';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path } from 'react-native-svg';
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
import DatePicker from 'react-native-date-picker';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import { Divider } from '@/components/ui/divider';
import FastImage from 'react-native-fast-image';
import { useRegisterForm } from '../../hooks/useRegisterForm';

type InputFieldType = 'email' | 'username' | 'password' | 'repeatPassword';

export const Register = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [togglePassword, setTogglePassword] = useState(false);
  const [toggleRepeatPassword, setToggleRepeatPassword] = useState(false);
  const [datePickerOpened, setDatePickerOpened] = useState(false);
  const [focusedInput, setFocusedInput] = useState<InputFieldType | null>(null);

  const {
    formData,
    errors,
    loading,
    touchedFields,
    submitted,
    updateField,
    handleBlur,
    handleRegister,
    isFormValid,
  } = useRegisterForm(t);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.granted) {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        updateField('profileImage', result.assets[0].uri);
      }
    } else {
      Alert.alert(
        t('permission-required') || 'Permission Required',
        t('media-library-permission-required') ||
          'Access to media library is required',
        [{ text: 'OK' }]
      );
    }
  };

  const onRegisterPress = async () => {
    if (loading) return;

    const success = await handleRegister();
    if (!success && errors.general) {
      Alert.alert(t('error') || 'Error', errors.general);
    }
  };

  const shouldShowError = (field: keyof typeof errors): boolean => {
    return (touchedFields.has(field as any) || submitted) && !!errors[field];
  };

  return (
    <AuthLayout pageTitle={t('Register')}>
      <View style={styles.contentWrapper}>
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
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>{t('profile-photo')}</Text>
          <Text style={styles.sectionSubtitle}>{t('optional')}</Text>

          <View style={styles.photoContainer}>
            {formData.profileImage ? (
              <TouchableOpacity
                onPress={pickImage}
                accessibilityRole="button"
                accessibilityLabel={t('change-photo') as string}
                activeOpacity={0.8}
              >
                <FastImage
                  source={{
                    uri: formData.profileImage,
                    priority: FastImage.priority.normal,
                  }}
                  style={styles.profilePicture}
                />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoOverlayText}>
                    {t('change-photo')}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                accessibilityRole="button"
                accessibilityLabel={t('add-photo') as string}
                activeOpacity={0.8}
              >
                <View style={styles.photoPlaceholder}>
                  <Svg
                    width="200"
                    height="209"
                    viewBox="0 0 200 209"
                    fill="none"
                  >
                    <Circle
                      cx="100"
                      cy="100"
                      r="97"
                      fill="#031824"
                      stroke="#10D9B9"
                      strokeWidth="6"
                    />
                    <Path
                      d="M121.666 107.558L119.148 109.821L122.345 110.934C131.86 114.247 140.115 120.452 145.966 128.691C151.817 136.93 154.975 146.795 155 156.919C155 158.004 154.57 159.043 153.809 159.808C153.049 160.572 152.019 161 150.947 161C149.876 161 148.846 160.572 148.085 159.808C147.324 159.043 146.895 158.003 146.895 156.917V156.915C146.884 146.147 142.622 135.82 135.043 128.203C127.463 120.585 117.183 116.299 106.459 116.288H106.457H92.5434H92.5413C81.8172 116.299 71.5374 120.585 63.9573 128.203C56.3775 135.82 52.1162 146.147 52.1053 156.915V156.917C52.1053 158.003 51.6759 159.043 50.9148 159.808C50.154 160.572 49.1242 161 48.0526 161C46.981 161 45.9513 160.572 45.1905 159.808C44.4297 159.043 44.0003 158.004 44 156.918C44.0139 146.812 47.1493 136.96 52.972 128.723C58.7949 120.486 67.0175 114.27 76.5036 110.932L79.6849 109.812L77.1767 107.558C72.1385 103.029 68.586 97.0682 66.9909 90.4636C65.3959 83.859 65.834 76.9232 68.2469 70.5747C70.6598 64.2262 74.9332 58.7653 80.5 54.9134C86.0668 51.0617 92.6649 49 99.4214 49C106.178 49 112.776 51.0617 118.343 54.9134C123.91 58.7653 128.183 64.2262 130.596 70.5747C133.009 76.9232 133.447 83.859 131.852 90.4636C130.257 97.0682 126.704 103.029 121.666 107.558ZM54.1053 156.917C54.1157 146.675 58.1687 136.856 65.375 129.614C72.5813 122.371 82.3522 118.298 92.5434 118.288H106.457C116.648 118.298 126.419 122.371 133.625 129.614C140.831 136.856 144.884 146.675 144.895 156.917H54.1053ZM113.397 61.7348C109.261 58.9575 104.398 57.4744 99.4214 57.4744C92.7481 57.4744 86.3502 60.1387 81.6346 64.8778C79.2997 67.2243 77.4482 70.0094 76.1851 73.0739C74.922 76.1385 74.272 79.4226 74.272 82.7391C74.272 87.7337 75.7457 92.617 78.5079 96.7715C81.2702 100.926 85.1973 104.166 89.7939 106.079C94.3906 107.993 99.4492 108.493 104.33 107.518C109.21 106.542 113.692 104.134 117.208 100.6C120.725 97.0664 123.118 92.565 124.088 87.6661C125.057 82.7672 124.56 77.6892 122.658 73.0739C120.755 68.4586 117.533 64.5121 113.397 61.7348Z"
                      fill="#10D9B9"
                      stroke="#031824"
                      strokeWidth="4"
                    />
                    <Path
                      d="M172.5 158C157.339 158 145 169.441 145 183.5C145 197.559 157.339 209 172.5 209C187.661 209 200 197.559 200 183.5C200 169.441 187.661 158 172.5 158ZM183.486 185.513H174.671V193.687C174.671 194.801 173.701 195.7 172.5 195.7C171.299 195.7 170.329 194.801 170.329 193.687V185.513H161.514C160.313 185.513 159.343 184.614 159.343 183.5C159.343 182.386 160.313 181.487 161.514 181.487H170.329V173.313C170.329 172.199 171.299 171.3 172.5 171.3C173.701 171.3 174.671 172.199 174.671 173.313V181.487H183.486C184.687 181.487 185.657 182.386 185.657 183.5C185.657 184.614 184.68 185.513 183.486 185.513Z"
                      fill="#10D9B9"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Divider style={styles.sectionDivider} />

        {/* Account Information Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('account-info')}</Text>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={styles.formControl}
            isInvalid={shouldShowError('email')}
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
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </Input>
            {!shouldShowError('email') && formData.email.length === 0 && (
              <FormControlHelper>
                <FormControlHelperText style={styles.helperText}>
                  {t('enter-valid-email')}
                </FormControlHelperText>
              </FormControlHelper>
            )}
            {!shouldShowError('email') &&
              formData.email.length > 0 &&
              !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(formData.email) && (
                <FormControlHelper>
                  <FormControlHelperText
                    style={[styles.helperText, { color: warningColor }]}
                  >
                    {t('invalid-email')}
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            {shouldShowError('email') && (
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
                  {errors.email}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={styles.formControl}
            isInvalid={shouldShowError('username')}
          >
            <FormControlLabel>
              <FormControlLabelText style={styles.labelText}>
                {t('user-name')} <Text style={styles.requiredStar}>*</Text>
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              className="my-1"
              variant="rounded"
              size="xl"
              style={[
                formStyles.inputPrimary,
                focusedInput === 'username' && styles.inputFocused,
              ]}
            >
              <InputField
                type="text"
                placeholder={t('user-name')}
                style={{ color: primaryTextColor }}
                onChangeText={value => updateField('username', value)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => {
                  setFocusedInput(null);
                  handleBlur('username');
                }}
                value={formData.username}
                autoCapitalize="words"
                autoComplete="username"
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </Input>
            {!shouldShowError('username') && formData.username.length === 0 && (
              <FormControlHelper>
                <FormControlHelperText style={styles.helperText}>
                  {t('min-characters', { count: 3 })}
                </FormControlHelperText>
              </FormControlHelper>
            )}
            {!shouldShowError('username') &&
              formData.username.length > 0 &&
              formData.username.length < 3 && (
                <FormControlHelper>
                  <FormControlHelperText
                    style={[styles.helperText, { color: warningColor }]}
                  >
                    {t('username-min-length')}
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            {shouldShowError('username') && (
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
                  {errors.username}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={styles.formControl}
            isInvalid={shouldShowError('dateOfBirth')}
          >
            <FormControlLabel>
              <FormControlLabelText style={styles.labelText}>
                {t('date-of-birth')} <Text style={styles.requiredStar}>*</Text>
              </FormControlLabelText>
            </FormControlLabel>
            <TouchableOpacity
              onPress={() => setDatePickerOpened(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('select-date-of-birth') as string}
            >
              <View pointerEvents="none">
                <Input
                  className="my-1"
                  variant="rounded"
                  size="xl"
                  style={formStyles.inputPrimary}
                  isReadOnly={true}
                >
                  <InputField
                    value={formData.dateOfBirth.toLocaleDateString()}
                    style={{ color: primaryTextColor }}
                    editable={false}
                  />
                </Input>
              </View>
            </TouchableOpacity>
            <DatePicker
              modal
              open={datePickerOpened}
              date={formData.dateOfBirth}
              mode="date"
              maximumDate={new Date()}
              onConfirm={date => {
                setDatePickerOpened(false);
                updateField('dateOfBirth', date);
                handleBlur('dateOfBirth');
              }}
              onCancel={() => {
                setDatePickerOpened(false);
              }}
            />
            {shouldShowError('dateOfBirth') && (
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
                  {errors.dateOfBirth}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>
        </View>

        <Divider style={styles.sectionDivider} />

        {/* Security Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('security')}</Text>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={styles.formControl}
            isInvalid={shouldShowError('password')}
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
                autoCapitalize="none"
                autoComplete="password-new"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <InputSlot
                className="pr-3"
                onPress={() => setTogglePassword(!togglePassword)}
              >
                <InputIcon as={togglePassword ? EyeIcon : EyeOffIcon} />
              </InputSlot>
            </Input>
            {!shouldShowError('password') && formData.password.length === 0 && (
              <FormControlHelper>
                <FormControlHelperText style={styles.helperText}>
                  {t('password-requirement') || 'Must be at least 6 characters'}
                </FormControlHelperText>
              </FormControlHelper>
            )}
            {!shouldShowError('password') &&
              formData.password.length > 0 &&
              formData.password.length < 6 && (
                <FormControlHelper>
                  <FormControlHelperText
                    style={[styles.helperText, { color: warningColor }]}
                  >
                    {t('min-characters', { count: 6 })}
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            {shouldShowError('password') && (
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
                  {errors.password}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={styles.formControl}
            isInvalid={shouldShowError('repeatPassword')}
          >
            <FormControlLabel>
              <FormControlLabelText style={styles.labelText}>
                {t('repeatPassword')} <Text style={styles.requiredStar}>*</Text>
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              className="my-1"
              variant="rounded"
              size="xl"
              style={[
                formStyles.inputPrimary,
                focusedInput === 'repeatPassword' && styles.inputFocused,
              ]}
            >
              <InputField
                type={toggleRepeatPassword ? 'text' : 'password'}
                placeholder={t('repeatPassword')}
                style={{ color: primaryTextColor }}
                onChangeText={value => updateField('repeatPassword', value)}
                onFocus={() => setFocusedInput('repeatPassword')}
                onBlur={() => {
                  setFocusedInput(null);
                  handleBlur('repeatPassword');
                }}
                value={formData.repeatPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <InputSlot
                className="pr-3"
                onPress={() => setToggleRepeatPassword(!toggleRepeatPassword)}
              >
                <InputIcon as={toggleRepeatPassword ? EyeIcon : EyeOffIcon} />
              </InputSlot>
            </Input>
            {!shouldShowError('repeatPassword') &&
              formData.repeatPassword.length > 0 &&
              formData.repeatPassword !== formData.password && (
                <FormControlHelper>
                  <FormControlHelperText
                    style={[styles.helperText, { color: warningColor }]}
                  >
                    {t('noMatchingPasswords')}
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            {shouldShowError('repeatPassword') && (
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
                  {errors.repeatPassword}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>
        </View>

        <Divider style={styles.sectionDivider} />

        {/* Legal Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('legal-agreements')}</Text>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={[styles.formControl, styles.termsControl]}
          >
            <View style={styles.checkboxRow}>
              <BouncyCheckbox
                style={styles.checkbox}
                fillColor={primaryColor}
                isChecked={formData.acceptsTermsOfUse}
                onPress={() =>
                  updateField('acceptsTermsOfUse', !formData.acceptsTermsOfUse)
                }
                useBuiltInState={false}
                disableText
              />
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxText}>
                  {t('i-accept')}{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      (navigation as any).navigate('TermsOfService')
                    }
                  >
                    {t('terms-of-service-instrumental') ||
                      t('terms-of-service')}
                  </Text>
                </Text>
              </View>
            </View>
            {submitted && !formData.acceptsTermsOfUse && (
              <Text style={styles.termsError}>
                {t('accept-terms-required')}
              </Text>
            )}
          </FormControl>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={[styles.formControl, styles.termsControl]}
          >
            <View style={styles.checkboxRow}>
              <BouncyCheckbox
                style={styles.checkbox}
                fillColor={primaryColor}
                isChecked={formData.acceptsPrivacyPolicy}
                onPress={() =>
                  updateField(
                    'acceptsPrivacyPolicy',
                    !formData.acceptsPrivacyPolicy
                  )
                }
                useBuiltInState={false}
                disableText
              />
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxText}>
                  {t('i-accept')}{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      (navigation as any).navigate('PrivacyPolicy')
                    }
                  >
                    {t('privacy-policy-instrumental') || t('privacy-policy')}
                  </Text>
                </Text>
              </View>
            </View>
            {submitted && !formData.acceptsPrivacyPolicy && (
              <Text style={styles.termsError}>
                {t('accept-privacy-required')}
              </Text>
            )}
          </FormControl>

          <FormControl
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
            style={[styles.formControl, styles.termsControl]}
          >
            <View style={styles.checkboxRow}>
              <BouncyCheckbox
                style={styles.checkbox}
                fillColor={primaryColor}
                isChecked={formData.acceptsCommunityGuidelines}
                onPress={() =>
                  updateField(
                    'acceptsCommunityGuidelines',
                    !formData.acceptsCommunityGuidelines
                  )
                }
                useBuiltInState={false}
                disableText
              />
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxText}>
                  {t('i-accept')}{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      (navigation as any).navigate('CommunityGuidelines')
                    }
                  >
                    {t('community-guidelines-instrumental') ||
                      t('community-guidelines')}
                  </Text>
                </Text>
              </View>
            </View>
            {submitted && !formData.acceptsCommunityGuidelines && (
              <Text style={styles.termsError}>
                {t('accept-community-required')}
              </Text>
            )}
          </FormControl>

          <Text style={styles.legalNotice}>{t('minimum-age-notice')}</Text>
        </View>

        {/* Submit Button */}
        <Center style={styles.buttonContainer}>
          <Button
            variant="solid"
            size="lg"
            action="primary"
            style={[
              formStyles.buttonPrimary,
              styles.submitButton,
              !isFormValid() && styles.buttonDisabled,
            ]}
            onPress={onRegisterPress}
            isDisabled={loading}
          >
            {!loading && (
              <ButtonText style={formStyles.buttonText}>
                {t('create-account') || t('register')}
              </ButtonText>
            )}
            {loading && <ButtonSpinner />}
          </Button>
        </Center>

        <View style={styles.bottomSpacing} />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: primaryColor,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: secondaryTextColor,
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    position: 'relative',
  },
  profilePicture: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    alignItems: 'center',
  },
  photoOverlayText: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionDivider: {
    marginVertical: 24,
    backgroundColor: primaryColor,
    opacity: 0.3,
  },
  formSection: {
    marginBottom: 8,
  },
  formControl: {
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: primaryColor,
    borderWidth: 2,
    shadowColor: primaryColor,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
  helperText: {
    color: secondaryTextColor,
    fontSize: 12,
  },
  termsControl: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    marginTop: 0,
    marginRight: 0,
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  checkboxText: {
    color: primaryTextColor,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsError: {
    color: warningColor,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  legalNotice: {
    color: secondaryTextColor,
    fontSize: 12,
    marginTop: 16,
    marginHorizontal: 8,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButton: {
    minWidth: 280,
    height: 54,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default Register;
