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

  const validateBio = (text: string): string => {
    if (text.length > MAX_BIO_LENGTH) {
      return (
        t('bio.too-long') || `Bio cannot exceed ${MAX_BIO_LENGTH} characters`
      );
    }
    return '';
  };

  const handleBioChange = (text: string) => {
    setBio(text);
    const validationError = validateBio(text);
    setError(validationError);
  };

  const handleSave = async () => {
    const validationError = validateBio(bio);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSave(bio);
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
            <Text style={styles.title}>{t('bio.edit-title') || 'Edit Bio'}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {t('bio.description') || 'Tell others about yourself in a few words.'}
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

          {/* Character counter */}
          <View style={styles.counterContainer}>
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
              {bio.length}/{MAX_BIO_LENGTH}
            </Text>
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
