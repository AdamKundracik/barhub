import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { useThemeColors } from '../../../utils/styles/themeColors';
import { useTranslation } from 'react-i18next';
import { ButtonSpinner } from '@/components/ui/button';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

interface BioEditModalProps {
  visible: boolean;
  currentBio?: string;
  onClose: () => void;
  onSave: (bio: string) => Promise<void>;
  isLoading?: boolean;
}

const BioEditModal: React.FC<BioEditModalProps> = ({
  visible,
  currentBio = '',
  onClose,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { showErrorToast } = useCustomToast();
  const [bio, setBio] = useState(currentBio);
  const [error, setError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const MAX_BIO_LENGTH = 90;
  const remainingChars = MAX_BIO_LENGTH - bio.length;

  // Handle modal visibility
  useEffect(() => {
    if (visible) {
      setBio(currentBio);
      setError('');
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, currentBio]);

  // Handle keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  // Check for valid Unicode characters (allows emojis and standard characters)
  const isValidBioCharacters = (text: string): boolean => {
    if (!text || text.trim().length === 0) {
      return true; // Empty is valid
    }

    // Allow letters, numbers, spaces, line breaks, common punctuation, and emojis
    // Very permissive - allows all standard Unicode characters including emojis
    // This pattern allows:
    // - All Unicode letters (\p{L})
    // - All Unicode numbers (\p{N})
    // - Whitespace, line breaks (\s, \n, \r)
    // - Common punctuation and symbols
    // - Emojis and other Unicode symbols
    const permissiveUnicodePattern = /^[\p{L}\p{N}\p{M}\p{S}\p{P}\s\n\r]*$/u;
    
    // Check if string contains only valid Unicode characters (including emojis)
    return permissiveUnicodePattern.test(text);
  };

  const validateBio = (text: string): string => {
    // Check if bio is empty
    if (!text.trim()) {
      return '';
    }

    // Check for valid characters first
    if (!isValidBioCharacters(text)) {
      return (
        t('bio.invalid-characters') ||
        t('username-invalid-characters') ||
        'Bio cannot contain emojis or special symbols'
      );
    }

    // Check character length
    if (text.length > MAX_BIO_LENGTH) {
      return (
        t('bio.too-long') || `Bio cannot exceed ${MAX_BIO_LENGTH} characters`
      );
    }

    // Check for excessive whitespace (more than 3 consecutive spaces)
    if (/\s{4,}/.test(text)) {
      return (
        t('bio.excessive-whitespace') ||
        'Bio cannot have more than 3 consecutive spaces'
      );
    }

    // Check for repetitive characters (same character repeated more than 5 times)
    if (/(.)\1{5,}/.test(text)) {
      return (
        t('bio.repetitive-characters') ||
        'Bio cannot have the same character repeated more than 5 times'
      );
    }

    // Check for spam-like patterns (too many special characters)
    const specialCharCount = (
      text.match(/[!@#$%^&*()_+={}[\]|\\:";'<>?,./~`]/g) || []
    ).length;
    if (specialCharCount > text.length * 0.3) {
      return (
        t('bio.too-many-special-chars') ||
        'Bio cannot have more than 30% special characters'
      );
    }

    // Check for minimum meaningful content (at least 3 non-space characters)
    const meaningfulChars = text.replace(/\s/g, '').length;
    if (meaningfulChars < 3) {
      return t('bio.too-short') || 'Bio must have at least 3 characters';
    }

    return '';
  };

  const handleBioChange = (text: string) => {
    // Filter out problematic characters that could bypass validation
    let filteredText = text
      .replace(/[\t]/g, ' '); // Replace tabs with spaces

    // Limit consecutive spaces to 3
    filteredText = filteredText.replace(/\s{4,}/g, '   ');

    setBio(filteredText);
    const validationError = validateBio(filteredText);
    setError(validationError);
  };

  const handleSave = async () => {
    const validationError = validateBio(bio);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSave(bio.trim());
      onClose();
    } catch (error) {
      console.error('Error saving bio:', error);
      showErrorToast(
        t('bio.save-error-title') || 'Error',
        t('bio.save-error-message') || 'Failed to save bio. Please try again.'
      );
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Dynamic snap points based on keyboard visibility
  const snapPoints = keyboardVisible ? ['85%', '95%'] : ['60%', '80%'];

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={handleClose}
      enablePanDownToClose={!isLoading}
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <BottomSheetView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('bio.edit-title') || 'Edit Bio'}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {t('bio.description') ||
              'Tell others about yourself in a few words.'}
          </Text>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, error ? styles.textInputError : null]}
              value={bio}
              onChangeText={handleBioChange}
              placeholder={t('bio.placeholder') || 'Write your bio here...'}
              placeholderTextColor={colors.secondaryTextColor}
              multiline
              numberOfLines={4}
              maxLength={MAX_BIO_LENGTH}
              editable={!isLoading}
              autoFocus
              returnKeyType="default"
              blurOnSubmit={false}
            />

            {/* Character counter */}
            <View style={styles.counterContainer}>
              <Text
                style={[
                  styles.counter,
                  {
                    color:
                      remainingChars < 0
                        ? colors.warningColor
                        : remainingChars < 20
                          ? '#F59E0B'
                          : colors.secondaryTextColor,
                  },
                ]}
              >
                {bio.length}/{MAX_BIO_LENGTH} chars
              </Text>

              {/* Quality indicators */}
              {bio.trim() && (
                <View style={styles.qualityIndicators}>
                  {bio.trim().length >= 10 && (
                    <Text style={[styles.qualityIndicator, styles.qualityGood]}>
                      {t('bio.good-length')}
                    </Text>
                  )}
                  {bio.trim().length < 10 && bio.trim().length >= 3 && (
                    <Text
                      style={[styles.qualityIndicator, styles.qualityWarning]}
                    >
                      {t('bio.consider-adding-more') || '⚠ Consider adding more details'}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Error message */}
            {error ? (
              <View style={styles.errorContainer}>
                <FontAwesomeIcon
                  icon={Icons.Warning}
                  size={14}
                  color={colors.warningColor}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (isLoading || !!error || bio === currentBio) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading || !!error || bio === currentBio}
            >
              {isLoading ? (
                <ButtonSpinner color="white" />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    (isLoading || !!error || bio === currentBio) &&
                      styles.saveButtonTextDisabled,
                  ]}
                >
                  {t('save') || 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'rgba(20,27,34,0.8)', // Static color for StyleSheet
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#444',
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF', // Static color for StyleSheet
  },
  description: {
    fontSize: 14,
    color: '#a0a0a0', // Static color for StyleSheet
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    color: '#FFFFFF', // Static color for StyleSheet
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
  },
  textInputError: {
    borderColor: '#FE7878', // Static color for StyleSheet
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  countersRow: {
    flexDirection: 'row',
    gap: 16,
  },
  qualityIndicators: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  qualityIndicator: {
    fontSize: 11,
    fontWeight: '500',
  },
  qualityGood: {
    color: '#10B981',
  },
  qualityWarning: {
    color: '#F59E0B',
  },
  counter: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: '#FE7878', // Static color for StyleSheet
    fontSize: 12,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButton: {
    backgroundColor: '#10D9B9', // Static color for StyleSheet
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
});

export default BioEditModal;
