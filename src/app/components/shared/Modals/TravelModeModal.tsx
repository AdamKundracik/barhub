import React, { useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  bottomModalBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';
import { useModalsStore } from '@/src/app/utils/store/modalsStore';
import { useLocationStore } from '@/src/app/utils/store/locationStore';

export const TravelModeModal = () => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { isTravelModeOpen, closeTravelMode, toggleFilter } = useModalsStore();
  const { setUseFakeLocation } = useLocationStore();

  // Get screen height for responsive snap points
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const isSmallDevice = SCREEN_HEIGHT < 700;

  // Calculate dynamic snap points based on device size
  const snapPoints = isSmallDevice ? ['70%'] : ['65%'];

  useEffect(() => {
    if (isTravelModeOpen) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isTravelModeOpen]);

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

  const handleDisableTravelMode = () => {
    setUseFakeLocation(false);
    closeTravelMode();
  };

  const handleOpenFilterSlider = () => {
    closeTravelMode();
    toggleFilter();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={closeTravelMode}
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <FontAwesomeIcon
            icon={Icons.Plane}
            size={40}
            color={primaryColor}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('travel-mode')}</Text>

        {/* Status */}
        <Text style={styles.status}>{t('travel-mode-active')}</Text>

        {/* Description */}
        <Text style={styles.message}>{t('travel-mode-description')}</Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleDisableTravelMode}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>
              {t('disable-travel-mode')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleOpenFilterSlider}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>{t('settings')}</Text>
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
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
    alignItems: 'center',
    flexGrow: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 217, 185, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(16, 217, 185, 0.3)',
  },
  title: {
    color: primaryTextColor,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  status: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    color: secondaryTextColor,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    color: primaryTextColor,
    fontSize: 16,
    fontWeight: '600',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 50,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 12,
  },
});


