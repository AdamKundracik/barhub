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
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { bottomModalBgColor } from '@/src/app/utils/styles/colors';

type PostReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (reason: ReportReason, customReason?: string) => Promise<void> | void; // môže byť async
};

export const PostReportModal = ({
  visible,
  onClose,
  onSave,
}: PostReportModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showCustomReason, setShowCustomReason] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [customReasonError, setCustomReasonError] = useState('');

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      setShowCustomReason(false);
      setCustomReason('');
      setCustomReasonError('');
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
      t('reportPost.confirmTitle'),
      t('reportPost.confirmMessage', { reason: label }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reportPost.submit'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onSave(reason, undefined);
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
      setCustomReasonError(t('reportPost.customReasonRequired'));
      return;
    }

    Alert.alert(
      t('reportPost.confirmTitle'),
      t('reportPost.confirmMessage', { reason: customReason.trim() }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reportPost.submit'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onSave(ReportReason.OTHER, customReason.trim());
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

  const reasons = [
    { value: ReportReason.SPAM, label: t('reportPost.spam') },
    { value: ReportReason.INAPPROPRIATE, label: t('reportPost.inappropriate') },
    { value: ReportReason.HARASSMENT, label: t('reportPost.harassment') },
    { value: ReportReason.OTHER, label: t('reportPost.other') },
  ];

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom + 20}>
        <View style={styles.footerContainer}>
          {showCustomReason ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleCustomReasonSubmit}
                disabled={loading || !customReason.trim()}
              >
                <Text style={styles.submitButtonText}>{t('reportPost.submit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleBackToReasons}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{t('go-back')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheetFooter>
    ),
    [showCustomReason, customReason, loading]
  );

  return (
    <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['60%']}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        backgroundStyle={styles.container}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose
        footerComponent={renderFooter}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <BottomSheetView style={styles.content}>
          {showCustomReason ? (
            <>
              <Text style={styles.title}>{t('reportPost.customReasonTitle')}</Text>
              
              <TextInput
                style={[styles.textInput, customReasonError ? styles.textInputError : null]}
                placeholder={t('reportPost.customReasonPlaceholder')}
                placeholderTextColor="#666"
                value={customReason}
                onChangeText={(text) => {
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
              
              {customReasonError ? <Text style={styles.errorText}>{customReasonError}</Text> : null}
              
              <Text style={styles.characterCount}>
                {customReason.length}/500
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('reportPost.title')}</Text>
              <Text style={styles.subtitle}>{t('reportPost.chooseReason')}</Text>

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
  footerContainer: {
    paddingHorizontal: 20,
    gap: 12,
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
});
