import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

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
  const colors = useThemeColors();
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
      snapPoints={['70%']}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={[
        styles.container,
        { backgroundColor: colors.bottomModalBgColor },
      ]}
      handleIndicatorStyle={[
        styles.handleIndicator,
        { backgroundColor: colors.separatorColor },
      ]}
      enablePanDownToClose
    >
      <BottomSheetScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesomeIcon
              icon={Icons.TrashCan}
              size={32}
              color={colors.warningColor}
            />
          </View>
          <Text style={[styles.title, { color: colors.primaryTextColor }]}>
            {t('delete-account-confirm-title') || 'Confirm Account Deletion'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
            {t('delete-account-confirm-subtitle') ||
              'This action cannot be undone. All your data will be permanently deleted.'}
          </Text>
        </View>

        {/* Confirmation Text Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.primaryTextColor }]}>
            {t('delete-account-type-text') ||
              'Type the following text to confirm:'}
          </Text>
          <Text
            style={[styles.confirmationText, { color: colors.warningColor }]}
          >
            {confirmationText}
          </Text>

          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.primaryTextColor + '0D', // ~5% opacity
                color: colors.primaryTextColor,
                borderColor: error
                  ? colors.warningColor
                  : colors.separatorColor,
              },
              error && styles.textInputError,
            ]}
            value={inputText}
            onChangeText={text => {
              setInputText(text);
              if (error) setError('');
            }}
            placeholder={t('delete-account-type-here') || 'Type here...'}
            placeholderTextColor={colors.secondaryTextColor}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {error ? (
            <Text style={[styles.errorText, { color: colors.warningColor }]}>
              {error}
            </Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              {
                backgroundColor: colors.separatorColor + '33', // ~20% opacity
                borderColor: colors.separatorColor,
              },
            ]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.primaryTextColor }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              { backgroundColor: colors.warningColor },
              !isConfirmEnabled && [
                styles.confirmButtonDisabled,
                { backgroundColor: colors.separatorColor },
              ],
            ]}
            onPress={handleConfirm}
            disabled={!isConfirmEnabled}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryTextColor} />
            ) : (
              <Text
                style={[
                  styles.confirmButtonText,
                  { color: colors.primaryTextColor },
                ]}
              >
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FE787820', // warningColor + 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    // color is set inline to use theme colors
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    // color is set inline to use theme colors
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    // color is set inline to use theme colors
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '700',
    // color is set inline to use theme colors
    backgroundColor: '#FE787815', // warningColor + 15% opacity
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FE787830', // warningColor + 30% opacity
  },
  textInput: {
    // backgroundColor, color, and borderColor are set inline to use theme colors
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textInputError: {
    // borderColor is set inline to use theme colors
  },
  errorText: {
    // color is set inline to use theme colors
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
    // backgroundColor and borderColor are set inline to use theme colors
    borderWidth: 1,
  },
  cancelButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    // backgroundColor is set inline to use theme colors
  },
  confirmButtonDisabled: {
    // backgroundColor is set inline to use theme colors
  },
  confirmButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '700',
  },
  handleIndicator: {
    // backgroundColor is set inline to use theme colors
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
});
