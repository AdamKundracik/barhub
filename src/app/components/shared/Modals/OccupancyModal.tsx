import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { OccupancyEnum } from '@/src/app/utils/types/Feed/PostTypes';
import {
  bottomModalBgColor,
  primaryColor,
  separatorColor,
} from '@/src/app/utils/styles/colors';

type OccupancyModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (occupancy: OccupancyEnum) => void;
  initialValue?: OccupancyEnum | null;
};

export const OccupancyModal = ({
  visible,
  onClose,
  onSelect,
  initialValue,
}: OccupancyModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [tempOccupancy, setTempOccupancy] = useState<OccupancyEnum | null>(
    initialValue || null
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      setTempOccupancy(initialValue || null);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, initialValue]);

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

  const handleClose = useCallback(() => {
    setTempOccupancy(initialValue || null);
    onClose();
  }, [initialValue, onClose]);

  const handleConfirm = useCallback(() => {
    if (tempOccupancy) {
      onSelect(tempOccupancy);
      onClose();
    }
  }, [tempOccupancy, onSelect, onClose]);

  const occupancyLabels: Record<OccupancyEnum, string> = {
    [OccupancyEnum.FULL]: t('full'),
    [OccupancyEnum.ALMOST_FULL]: t('almost-full'),
    [OccupancyEnum.SPARSELY_OCCUPIED]: t('sparsely-occupied'),
    [OccupancyEnum.EMPTY]: t('empty'),
  };

  const occupancyColors: Record<OccupancyEnum, string> = {
    [OccupancyEnum.FULL]: '#FF4444',
    [OccupancyEnum.ALMOST_FULL]: '#FF8800',
    [OccupancyEnum.SPARSELY_OCCUPIED]: '#FFBB00',
    [OccupancyEnum.EMPTY]: '#44AA44',
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['65%']}
      backdropComponent={renderBackdrop}
      onDismiss={handleClose}
      backgroundStyle={styles.modalContainer}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.modalContent}>
        {/* Header with corner buttons */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.modalHeaderButton}
          >
            <Text style={styles.modalCancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('select-occupancy')}</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.modalHeaderButton,
              !tempOccupancy && styles.modalDoneButtonDisabled,
            ]}
            disabled={!tempOccupancy}
          >
            <Text
              style={[
                styles.modalDoneText,
                !tempOccupancy && styles.modalDoneTextDisabled,
              ]}
            >
              {t('done')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Options */}
        <ScrollView
          style={styles.optionsScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionsContainer}>
            {Object.values(OccupancyEnum).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  tempOccupancy === option && styles.optionSelected,
                ]}
                onPress={() => setTempOccupancy(option)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionDot,
                      { backgroundColor: occupancyColors[option] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      tempOccupancy === option && styles.optionTextSelected,
                    ]}
                  >
                    {occupancyLabels[option]}
                  </Text>
                </View>
                {tempOccupancy === option && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  // Modal - Much wider and better
  modalContainer: {
    backgroundColor: bottomModalBgColor,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  handleIndicator: {
    backgroundColor: '#444',
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 5,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  modalCancelText: {
    color: separatorColor,
    fontSize: 17,
  },
  modalDoneText: {
    color: primaryColor,
    fontSize: 17,
    fontWeight: '600',
  },
  modalDoneTextDisabled: {
    color: '#666',
  },
  modalDoneButtonDisabled: {
    opacity: 0.5,
  },

  // Options - Much wider and better spacing
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    padding: 25,
    paddingTop: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 12,
    backgroundColor: '#252525',
  },
  optionSelected: {
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: primaryColor,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 15,
  },
  optionText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: primaryColor,
    fontWeight: '600',
  },
  checkmark: {
    color: primaryColor,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
});

