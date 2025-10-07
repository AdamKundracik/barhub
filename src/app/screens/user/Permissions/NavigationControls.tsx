import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';

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
  return (
    <View style={styles.arrowButtons}>
      <TouchableOpacity
        onPress={onPrevious}
        disabled={currentStep === 0}
        style={styles.arrowButton}
      >
        <FontAwesomeIcon
          icon={Icons.ChevronLeft}
          size={24}
          color={currentStep === 0 ? 'rgba(255,255,255,0.3)' : '#fff'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        disabled={currentStep === totalSteps - 1}
        style={styles.arrowButton}
      >
        <FontAwesomeIcon
          icon={Icons.ChevronRight}
          size={24}
          color={
            currentStep === totalSteps - 1 ? 'rgba(255,255,255,0.3)' : '#fff'
          }
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  arrowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  arrowButton: {
    padding: 10,
  },
});
