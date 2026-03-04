import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { bottomModalBgColor } from '@/src/app/utils/styles/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type CommentReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (reason: ReportReason, customReason?: string) => Promise<void> | void;
};

export const ReportCommentModal = ({
  visible,
  onClose,
  onSave,
}: CommentReportModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
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
      t('reportComment.confirmTitle') || 'Report Comment',
      t('reportComment.confirmMessage', { reason: label }) ||
        `Are you sure you want to report this comment as "${label}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reportComment.submit') || 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onSave(reason, undefined);
              onClose();
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
      setCustomReasonError(
        t('reportComment.customReasonRequired') ||
          'Please provide a reason for reporting this comment'
      );
      return;
    }

    Alert.alert(
      t('reportComment.confirmTitle') || 'Report Comment',
      t('reportComment.confirmMessage', { reason: customReason.trim() }) ||
        `Are you sure you want to report this comment?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reportComment.submit') || 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onSave(ReportReason.OTHER, customReason.trim());
              onClose();
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
    { value: ReportReason.SPAM, label: t('reportComment.spam') || 'Spam' },
    {
      value: ReportReason.INAPPROPRIATE,
      label: t('reportComment.inappropriate') || 'Inappropriate',
    },
    {
      value: ReportReason.HARASSMENT,
      label: t('reportComment.harassment') || 'Harassment',
    },
    {
      value: ReportReason.FAKE_CONTENT,
      label: t('reportComment.fakeContent') || 'Fake Content',
    },
    {
      value: ReportReason.VIOLENCE,
      label: t('reportComment.violence') || 'Violence',
    },
    {
      value: ReportReason.COPYRIGHT,
      label: t('reportComment.copyright') || 'Copyright',
    },
    { value: ReportReason.OTHER, label: t('reportComment.other') || 'Other' },
  ];

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      // enableDynamicSizing replaces the brittle snapPoints toggle between
      // '60%' and '90%' — the sheet now grows naturally with its content
      enableDynamicSizing
      maxDynamicContentSize={SCREEN_HEIGHT * 0.9}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
      // Let the sheet handle keyboard avoidance — no KeyboardAvoidingView needed
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {/*
        BottomSheetScrollView instead of BottomSheetView:
        - Handles overflow when keyboard is open and content is tall
        - keyboardShouldPersistTaps="handled" lets button presses fire
          before the keyboard dismisses
        - No KeyboardAvoidingView wrapper — keyboardBehavior="interactive"
          on the modal already handles this; doubling up causes layout bugs
      */}
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showCustomReason ? (
          <>
            <Text style={styles.title}>
              {t('reportComment.customReasonTitle') || 'Describe the issue'}
            </Text>

            {/*
              BottomSheetTextInput instead of plain TextInput:
              - Integrates with the sheet's keyboard handling
              - Prevents the sheet from dismissing on focus
            */}
            <BottomSheetTextInput
              style={[
                styles.textInput,
                customReasonError ? styles.textInputError : undefined,
              ]}
              placeholder={
                t('reportComment.customReasonPlaceholder') ||
                'Please describe why you are reporting this comment...'
              }
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
              blurOnSubmit
            />

            {customReasonError ? (
              <Text style={styles.errorText}>{customReasonError}</Text>
            ) : null}

            <Text style={styles.characterCount}>{customReason.length}/500</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (!customReason.trim() || loading) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleCustomReasonSubmit}
                disabled={loading || !customReason.trim()}
              >
                <Text style={styles.submitButtonText}>
                  {t('reportComment.submit') || 'Report'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleBackToReasons}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>
                  {t('go-back') || 'Go Back'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {t('reportComment.title') || 'Report Comment'}
            </Text>
            <Text style={styles.subtitle}>
              {t('reportComment.chooseReason') ||
                'Why are you reporting this comment?'}
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
                    color="white"
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 32,
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
  submitButtonDisabled: {
    backgroundColor: '#004999',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#222',
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
