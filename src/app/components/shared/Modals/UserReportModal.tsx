import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

type UserReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (reason: ReportReason, customReason?: string) => Promise<void> | void;
  onBlockUser?: () => Promise<void> | void; // Optional callback for direct blocking user after report
  userName?: string; // User name for display in block option
};

export const UserReportModal = ({
  visible,
  onClose,
  onSave,
  onBlockUser,
  userName = 'Unknown User',
}: UserReportModalProps) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [loading, setLoading] = useState(false);
  const [showCustomReason, setShowCustomReason] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [customReasonError, setCustomReasonError] = useState('');
  const [showSuccessWithBlock, setShowSuccessWithBlock] = useState(false);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      setShowCustomReason(false);
      setCustomReason('');
      setCustomReasonError('');
      setShowSuccessWithBlock(false);
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

  const handleSelect = (reason: ReportReason, label: string) => {
    if (reason === ReportReason.OTHER) {
      setShowCustomReason(true);
      return;
    }

    Alert.alert(
      t('reportUser.confirmTitle'),
      t('reportUser.confirmMessage', { reason: label }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reportUser.submit'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onSave(reason, undefined);
              // Show success screen with block option if callback is provided
              if (onBlockUser) {
                setShowSuccessWithBlock(true);
              } else {
                onClose();
              }
            } catch (error) {
              console.error('Error submitting report:', error);
              // Modal sa zatvorí automaticky cez parent handleReportUser pri chybe
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCustomReasonSubmit = () => {
    if (!customReason.trim()) {
      setCustomReasonError(t('reportUser.customReasonRequired'));
      return;
    }

    Alert.alert(
      t('reportUser.confirmTitle'),
      t('reportUser.confirmMessage', { reason: customReason.trim() }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reportUser.submit'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onSave(ReportReason.OTHER, customReason.trim());
              // Show success screen with block option if callback is provided
              if (onBlockUser) {
                setShowSuccessWithBlock(true);
              } else {
                onClose();
              }
            } catch (error) {
              console.error('Error submitting report:', error);
              // Modal sa zatvorí automaticky cez parent handleReportUser pri chybe
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBackToReasons = () => {
    setShowCustomReason(false);
    setCustomReason('');
    setCustomReasonError('');
  };

  const handleBlockAndClose = async () => {
    if (!onBlockUser) return;

    try {
      setLoading(true);
      await onBlockUser(); // Direct blocking without opening BlockUserModal
      onClose(); // Close modal after successful blocking
    } catch (error) {
      console.error('Error blocking user:', error);
      // Error handling is done in the parent function
    } finally {
      setLoading(false);
    }
  };

  const handleSkipBlock = () => {
    onClose();
  };

  const reasons = [
    { value: ReportReason.SPAM, label: t('reportUser.spam') },
    { value: ReportReason.INAPPROPRIATE, label: t('reportUser.inappropriate') },
    { value: ReportReason.HARASSMENT, label: t('reportUser.harassment') },
    { value: ReportReason.OTHER, label: t('reportUser.other') },
  ];

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={showCustomReason ? ['90%'] : ['60%']}
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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <BottomSheetView style={styles.content}>
          {showSuccessWithBlock ? (
            <>
              <View style={styles.successIconContainer}>
                <FontAwesomeIcon
                  icon={Icons.CheckCircle}
                  size={32}
                  color={colors.successColor}
                />
              </View>

              <Text style={[styles.successTitle, { color: colors.primaryTextColor }]}>
                {t('reportUser.successTitle') || 'Report Submitted'}
              </Text>

              <Text style={[styles.successMessage, { color: colors.secondaryTextColor }]}>
                {t('reportUser.successDescription') ||
                  'Thank you for your report. We will review it shortly.'}
              </Text>

              <Text style={[styles.blockPrompt, { color: colors.primaryTextColor }]}>
                {t('reportUser.blockPrompt', { userName }) ||
                  `Would you also like to block ${userName}? You won't see their posts and they won't be able to interact with your content.`}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.blockButton,
                    { backgroundColor: colors.warningColor },
                  ]}
                  onPress={handleBlockAndClose}
                  disabled={loading}
                >
                  <Text style={[styles.blockButtonText, { color: colors.primaryBgColor }]}>
                    {t('blockUser.block') || 'Block User'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.skipButton,
                    {
                      backgroundColor: colors.separatorColor + '33',
                      borderColor: colors.separatorColor,
                    },
                  ]}
                  onPress={handleSkipBlock}
                  disabled={loading}
                >
                  <Text style={[styles.skipButtonText, { color: colors.primaryTextColor }]}>
                    {t('reportUser.skipBlock') || 'Skip'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : showCustomReason ? (
            <>
              <Text style={[styles.title, { color: colors.primaryTextColor }]}>
                {t('reportUser.customReasonTitle')}
              </Text>

              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.primaryTextColor + '0D',
                    color: colors.primaryTextColor,
                    borderColor: customReasonError ? colors.warningColor : colors.separatorColor,
                  },
                ]}
                placeholder={t('reportUser.customReasonPlaceholder')}
                placeholderTextColor={colors.secondaryTextColor}
                value={customReason}
                onChangeText={text => {
                  setCustomReason(text);
                  if (customReasonError) setCustomReasonError('');
                }}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!loading}
                autoFocus
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              {customReasonError ? (
                <Text style={[styles.errorText, { color: colors.warningColor }]}>{customReasonError}</Text>
              ) : null}

              <Text style={[styles.characterCount, { color: colors.secondaryTextColor }]}>
                {customReason.length}/500
              </Text>

              {/* Buttons inside content */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    { backgroundColor: colors.primaryColor },
                  ]}
                  onPress={handleCustomReasonSubmit}
                  disabled={loading || !customReason.trim()}
                >
                  <Text style={[styles.submitButtonText, { color: colors.primaryBgColor }]}>
                    {t('reportUser.submit')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: colors.separatorColor + '33',
                      borderColor: colors.separatorColor,
                    },
                  ]}
                  onPress={handleBackToReasons}
                  disabled={loading}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.primaryTextColor }]}>{t('go-back')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.primaryTextColor }]}>{t('reportUser.title')}</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
                {t('reportUser.chooseReason')}
              </Text>

              {reasons.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(r.value, r.label)}
                  disabled={loading}
                >
                  <View style={[styles.optionRow, { borderBottomColor: colors.separatorColor }]}>
                    <Text style={[styles.optionText, { color: colors.primaryTextColor }]}>{r.label}</Text>
                    <FontAwesomeIcon
                      icon={Icons.ChevronRight}
                      size={16}
                      color={colors.primaryTextColor}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color={colors.primaryTextColor} />
            </View>
          )}
        </BottomSheetView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    // color is set inline to use theme colors
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    // color is set inline to use theme colors
    fontSize: 14,
    marginBottom: 16,
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor is set inline to use theme colors
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: {
    // color is set inline to use theme colors
    fontSize: 16,
  },
  handleIndicator: {
    // backgroundColor is set inline to use theme colors
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  buttonContainer: {
    paddingHorizontal: 0,
    gap: 12,
    marginTop: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButton: {
    // backgroundColor is set inline to use theme colors
  },
  submitButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 12,
    // backgroundColor and borderColor are set inline to use theme colors
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    // backgroundColor, color, and borderColor are set inline to use theme colors
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    marginBottom: 8,
  },
  textInputError: {
    // borderColor is set inline to use theme colors
  },
  errorText: {
    // color is set inline to use theme colors
    fontSize: 14,
    marginBottom: 8,
  },
  characterCount: {
    // color is set inline to use theme colors
    fontSize: 12,
    textAlign: 'right',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successTitle: {
    // color is set inline to use theme colors
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    // color is set inline to use theme colors
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  blockPrompt: {
    // color is set inline to use theme colors
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  blockButton: {
    // backgroundColor is set inline to use theme colors
  },
  blockButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    // backgroundColor and borderColor are set inline to use theme colors
    borderWidth: 1,
  },
  skipButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '500',
  },
});
