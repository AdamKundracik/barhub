import React, { useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { Center } from '@/components/ui/center';
import { formStyles } from '@/src/app/utils/styles/styles';

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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['60%']}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      handleHeight={50}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('reportPost.title')}</Text>
        <Text style={styles.subtitle}>{t('reportPost.chooseReason')}</Text>

        {reasons.map(r => (
          <TouchableOpacity
            key={r.value}
            style={styles.option}
            onPress={() => handleSelect(r.value, r.label)}
          >
            <Text style={styles.optionText}>{r.label}</Text>
          </TouchableOpacity>
        ))}
        <Center>
          <TouchableOpacity style={formStyles.buttonSecondary}>
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        </Center>
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 15,
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#222',
    marginBottom: 10,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
  handleIndicator: {
    backgroundColor: 'white',
    width: '10%',
    margin: 5,
  },
});

export default PostReportModal;
