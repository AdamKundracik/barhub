import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

type PostReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (reason: ReportReason) => void;
};

export const PostReportModal = ({
  visible,
  onClose,
  onSave,
}: PostReportModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
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
    Alert.alert(
      t('reportPost.confirmTitle'),
      t('reportPost.confirmMessage', { reason: label }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reportPost.submit'),
          style: 'destructive',
          onPress: () => {
            onSave(reason);
            bottomSheetRef.current?.dismiss();
          },
        },
      ]
    );
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
        <View style={styles.cancelContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    []
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
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{t('reportPost.title')}</Text>
        <Text style={styles.subtitle}>{t('reportPost.chooseReason')}</Text>

        {reasons.map(r => (
          <TouchableOpacity
            key={r.value}
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => handleSelect(r.value, r.label)}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={styles.optionText}>{r.label}</Text>
              </View>
              <View>
                <FontAwesomeIcon
                  icon={Icons.ChevronRight}
                  size={16}
                  color={'white'}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(20,27,34,0.9)',
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
  cancelContainer: {
    paddingHorizontal: 20,
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
});

export default PostReportModal;
