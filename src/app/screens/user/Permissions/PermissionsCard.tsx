import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTranslation } from 'react-i18next';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { PermissionConfig } from '../../../utils/constants/permissions';
import { successColor } from '../../../utils/styles/colors';

interface PermissionCardProps {
  config: PermissionConfig;
  isGranted: boolean;
  onRequestPermission: () => void;
  currentStep: number;
  totalSteps: number;
}

const { width } = Dimensions.get('window');

export const PermissionCard: React.FC<PermissionCardProps> = ({
  config,
  isGranted,
  onRequestPermission,
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();

  return (
    <Animated.View
      key={config.key}
      entering={SlideInRight}
      exiting={SlideOutLeft}
      style={[styles.permissionContainer, isGranted && styles.grantedContainer]}
    >
      <FontAwesomeIcon icon={config.icon} size={120} color="#fff" />
      <Text style={styles.permissionTitle}>{t(config.titleKey)}</Text>
      <Text style={styles.permissionDescription}>
        {t(config.descriptionKey)}
      </Text>

      {isGranted ? (
        <Text style={styles.grantedText}>
          {t('permissions.alreadyGranted')}
        </Text>
      ) : (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={onRequestPermission}
        >
          <Text style={styles.buttonText}>{t('permissions.grant')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.step,
              index === currentStep && styles.activeStep,
              index < currentStep && styles.completedStep,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    width: width * 0.85,
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  grantedContainer: {
    borderWidth: 2,
    borderColor: successColor,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 20,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  grantedText: {
    color: successColor,
    fontSize: 20,
    marginBottom: 15,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  step: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeStep: {
    backgroundColor: '#fff',
    width: 24,
  },
  completedStep: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
