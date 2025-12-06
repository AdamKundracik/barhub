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
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

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
  const colors = useThemeColors();
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
      backgroundStyle={[
        styles.modalContainer,
        { backgroundColor: colors.bottomModalBgColor },
      ]}
      handleIndicatorStyle={[
        styles.handleIndicator,
        { backgroundColor: colors.separatorColor },
      ]}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.modalContent}>
        {/* Header with corner buttons */}
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: colors.separatorColor },
          ]}
        >
          <TouchableOpacity
            onPress={handleClose}
            style={styles.modalHeaderButton}
          >
            <Text style={[styles.modalCancelText, { color: colors.separatorColor }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.primaryTextColor }]}>
            {t('select-occupancy')}
          </Text>
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
                { color: tempOccupancy ? colors.primaryColor : colors.secondaryTextColor },
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
                  {
                    backgroundColor: tempOccupancy === option
                      ? colors.separatorColor + '33' // ~20% opacity
                      : colors.primaryTextColor + '0D', // ~5% opacity
                  },
                  tempOccupancy === option && [
                    styles.optionSelected,
                    { borderColor: colors.primaryColor },
                  ],
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
                      {
                        color: tempOccupancy === option
                          ? colors.primaryColor
                          : colors.primaryTextColor,
                      },
                      tempOccupancy === option && styles.optionTextSelected,
                    ]}
                  >
                    {occupancyLabels[option]}
                  </Text>
                </View>
                {tempOccupancy === option && (
                  <Text style={[styles.checkmark, { color: colors.primaryColor }]}>
                    ✓
                  </Text>
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
    // backgroundColor is set inline to use theme colors
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  handleIndicator: {
    // backgroundColor is set inline to use theme colors
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
    // borderBottomColor is set inline to use theme colors
  },
  modalHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  modalTitle: {
    // color is set inline to use theme colors
    fontSize: 20,
    fontWeight: '700',
  },
  modalCancelText: {
    // color is set inline to use theme colors
    fontSize: 17,
  },
  modalDoneText: {
    // color is set inline to use theme colors
    fontSize: 17,
    fontWeight: '600',
  },
  modalDoneTextDisabled: {
    // color is set inline to use theme colors
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
    // backgroundColor is set inline to use theme colors
  },
  optionSelected: {
    // backgroundColor and borderColor are set inline to use theme colors
    borderWidth: 2,
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
    // color is set inline to use theme colors
    fontSize: 17,
    fontWeight: '500',
  },
  optionTextSelected: {
    // color is set inline to use theme colors
    fontWeight: '600',
  },
  checkmark: {
    // color is set inline to use theme colors
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
});

