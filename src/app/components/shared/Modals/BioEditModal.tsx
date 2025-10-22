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
import {
  bottomModalBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '../../../utils/styles/colors';
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
  const { showErrorToast } = useCustomToast();
  const [bio, setBio] = useState(currentBio);
  const [error, setError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const MAX_BIO_LENGTH = 120;
  const MAX_BIO_LINES = 10;
  const remainingChars = MAX_BIO_LENGTH - bio.length;

  // Count lines properly, handling various line break characters
  const normalizedBio = bio.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const currentLines = normalizedBio.split('\n').length;
  const remainingLines = MAX_BIO_LINES - currentLines;

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

  const validateBio = (text: string): string => {
    // Check if bio is empty
    if (!text.trim()) {
      return '';
    }

    // Check character length
    if (text.length > MAX_BIO_LENGTH) {
      return (
        t('bio.too-long') || `Bio cannot exceed ${MAX_BIO_LENGTH} characters`
      );
    }

    // Count lines properly, handling various line break characters
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n');

    // Check line count
    if (lines.length > MAX_BIO_LINES) {
      return (
        t('bio.too-many-lines') || `Bio cannot exceed ${MAX_BIO_LINES} lines`
      );
    }

    // Check for excessive empty lines (more than 2 consecutive empty lines)
    const emptyLines = lines.filter(line => line.trim() === '');
    if (emptyLines.length > 2) {
      return (
        t('bio.too-many-empty-lines') ||
        'Bio cannot have more than 2 empty lines'
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
      .replace(/[\t]/g, ' ') // Replace tabs with spaces
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .replace(/\r/g, '\n'); // Normalize line breaks

    // Limit consecutive spaces to 3
    filteredText = filteredText.replace(/\s{4,}/g, '   ');

    // Limit consecutive line breaks to 2
    filteredText = filteredText.replace(/\n{3,}/g, '\n\n');

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
              placeholderTextColor={secondaryTextColor}
              multiline
              numberOfLines={4}
              maxLength={MAX_BIO_LENGTH}
              editable={!isLoading}
              autoFocus
              returnKeyType="default"
              blurOnSubmit={false}
            />

            {/* Character and line counters */}
            <View style={styles.counterContainer}>
              <View style={styles.countersRow}>
                <Text
                  style={[
                    styles.counter,
                    {
                      color:
                        remainingChars < 0
                          ? warningColor
                          : remainingChars < 20
                            ? '#F59E0B'
                            : secondaryTextColor,
                    },
                  ]}
                >
                  {bio.length}/{MAX_BIO_LENGTH} chars
                </Text>
                <Text
                  style={[
                    styles.counter,
                    {
                      color:
                        remainingLines < 0
                          ? warningColor
                          : remainingLines < 2
                            ? '#F59E0B'
                            : secondaryTextColor,
                    },
                  ]}
                >
                  {currentLines}/{MAX_BIO_LINES} lines
                </Text>
              </View>

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
                  color={warningColor}
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
    backgroundColor: bottomModalBgColor,
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
    color: primaryTextColor,
  },
  description: {
    fontSize: 14,
    color: secondaryTextColor,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    color: primaryTextColor,
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
    borderColor: warningColor,
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
    color: warningColor,
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
    backgroundColor: primaryColor,
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
