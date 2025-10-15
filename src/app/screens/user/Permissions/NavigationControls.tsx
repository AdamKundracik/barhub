import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { useTranslation } from 'react-i18next';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
}) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.navigationContainer}>
      {/* Previous Button */}
      <TouchableOpacity
        onPress={onPrevious}
        disabled={currentStep === 0}
        style={[
          styles.navButton,
          styles.previousButton,
          currentStep === 0 && styles.disabledButton
        ]}
      >
        <FontAwesomeIcon
          icon={Icons.ChevronLeft}
          size={20}
          color={currentStep === 0 ? 'rgba(255,255,255,0.3)' : '#fff'}
        />
        <Text style={[
          styles.navButtonText,
          currentStep === 0 && styles.disabledButtonText
        ]}>
          {t('permissions.previous')}
        </Text>
      </TouchableOpacity>


      {/* Next Button */}
      <TouchableOpacity
        onPress={onNext}
        disabled={currentStep === totalSteps - 1}
        style={[
          styles.navButton,
          styles.nextButton,
          currentStep === totalSteps - 1 && styles.disabledButton
        ]}
      >
        <Text style={[
          styles.navButtonText,
          currentStep === totalSteps - 1 && styles.disabledButtonText
        ]}>
          {t('permissions.next')}
        </Text>
        <FontAwesomeIcon
          icon={Icons.ChevronRight}
          size={20}
          color={currentStep === totalSteps - 1 ? 'rgba(255,255,255,0.3)' : '#fff'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    flexDirection: 'row',
  },
  nextButton: {
    flexDirection: 'row-reverse',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  completedDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
