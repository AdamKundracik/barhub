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
import { bottomModalBgColor } from '@/src/app/utils/styles/colors';

type UserReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (reason: ReportReason, customReason?: string) => Promise<void> | void;
  onBlockUser?: () => void; // Optional callback for blocking user after report
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

  const handleBlockAndClose = () => {
    onClose(); // Zatvor najprv UserReportModal
    // Použij setTimeout aby sa BlockUserModal zobrazil až po zatvorení UserReportModal
    setTimeout(() => {
      onBlockUser?.();
    }, 300); // 300ms delay pre smooth transition
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
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
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
                  color="#34C759"
                />
              </View>
              
              <Text style={styles.successTitle}>
                {t('reportUser.successTitle') || 'Report Submitted'}
              </Text>
              
              <Text style={styles.successMessage}>
                {t('reportUser.successDescription') || 'Thank you for your report. We will review it shortly.'}
              </Text>

              <Text style={styles.blockPrompt}>
                {t('reportUser.blockPrompt', { userName }) || `Would you also like to block ${userName}? You won't see their posts and they won't be able to interact with your content.`}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.blockButton]}
                  onPress={handleBlockAndClose}
                  disabled={loading}
                >
                  <Text style={styles.blockButtonText}>
                    {t('blockUser.block') || 'Block User'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.skipButton]}
                  onPress={handleSkipBlock}
                  disabled={loading}
                >
                  <Text style={styles.skipButtonText}>
                    {t('reportUser.skipBlock') || 'Skip'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : showCustomReason ? (
            <>
              <Text style={styles.title}>
                {t('reportUser.customReasonTitle')}
              </Text>

              <TextInput
                style={[
                  styles.textInput,
                  customReasonError ? styles.textInputError : null,
                ]}
                placeholder={t('reportUser.customReasonPlaceholder')}
                placeholderTextColor="#666"
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
                <Text style={styles.errorText}>{customReasonError}</Text>
              ) : null}

              <Text style={styles.characterCount}>
                {customReason.length}/500
              </Text>

              {/* Buttons inside content */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleCustomReasonSubmit}
                  disabled={loading || !customReason.trim()}
                >
                  <Text style={styles.submitButtonText}>
                    {t('reportUser.submit')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleBackToReasons}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>{t('go-back')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('reportUser.title')}</Text>
              <Text style={styles.subtitle}>
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
                  <View style={styles.optionRow}>
                    <Text style={styles.optionText}>{r.label}</Text>
                    <FontAwesomeIcon
                      icon={Icons.ChevronRight}
                      size={16}
                      color={'white'}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </BottomSheetView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: bottomModalBgColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
  handleIndicator: {
    backgroundColor: '#444',
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
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#222',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#333',
    color: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 8,
  },
  textInputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 8,
  },
  characterCount: {
    color: '#666',
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
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  blockPrompt: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  blockButton: {
    backgroundColor: '#FF3B30',
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});


