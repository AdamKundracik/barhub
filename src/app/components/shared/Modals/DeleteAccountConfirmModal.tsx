import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  bottomModalBgColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '@/src/app/utils/styles/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type DeleteAccountConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (confirmationText: string) => Promise<void> | void;
  confirmationText: string; // Text that user needs to type to confirm
  loading?: boolean;
};

export const DeleteAccountConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  confirmationText,
  loading = false,
}: DeleteAccountConfirmModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      setInputText('');
      setError('');
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleConfirm = async () => {
    if (inputText.trim() !== confirmationText) {
      setError(t('delete-account-text-mismatch') || 'Text does not match');
      return;
    }

    setError('');
    try {
      await onConfirm(inputText.trim());
    } catch (error) {
      console.error('Error in delete account confirmation:', error);
    }
  };

  const isConfirmEnabled = inputText.trim() === confirmationText && !loading;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      // enableDynamicSizing lets the sheet grow with its content height
      enableDynamicSizing
      // Cap at 85% — beyond this the ScrollView takes over internally
      maxDynamicContentSize={SCREEN_HEIGHT * 0.85}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
    >
      {/*
        BottomSheetScrollView is the correct child here (not BottomSheetView)
        because this sheet has a TextInput which may trigger the keyboard,
        pushing content up and requiring scroll fallback.
      */}
      <BottomSheetScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesomeIcon
              icon={Icons.TrashCan}
              size={32}
              color={warningColor}
            />
          </View>
          <Text style={styles.title}>
            {t('delete-account-confirm-title') || 'Confirm Account Deletion'}
          </Text>
          <Text style={styles.subtitle}>
            {t('delete-account-confirm-subtitle') ||
              'This action cannot be undone. All your data will be permanently deleted.'}
          </Text>
        </View>

        {/* Confirmation Text Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            {t('delete-account-type-text') ||
              'Type the following text to confirm:'}
          </Text>
          <Text style={styles.confirmationText}>{confirmationText}</Text>

          <BottomSheetTextInput
            style={[
              styles.textInput,
              error ? styles.textInputError : undefined,
            ]}
            value={inputText}
            onChangeText={text => {
              setInputText(text);
              if (error) setError('');
            }}
            placeholder={t('delete-account-type-here') || 'Type here...'}
            placeholderTextColor={secondaryTextColor}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              !isConfirmEnabled && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!isConfirmEnabled}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {t('delete-account')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: bottomModalBgColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    // Bottom padding accounts for home indicator on modern devices
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${warningColor}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: secondaryTextColor,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryTextColor,
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '700',
    color: warningColor,
    backgroundColor: `${warningColor}15`,
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${warningColor}30`,
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: primaryTextColor,
    borderWidth: 1,
    borderColor: '#444',
  },
  textInputError: {
    borderColor: warningColor,
  },
  errorText: {
    color: warningColor,
    fontSize: 14,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  cancelButtonText: {
    color: primaryTextColor,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: warningColor,
  },
  confirmButtonDisabled: {
    backgroundColor: '#666',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  handleIndicator: {
    backgroundColor: '#444',
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
});
