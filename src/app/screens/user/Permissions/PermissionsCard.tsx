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
      <FontAwesomeIcon icon={config.icon} size={80} color="#fff" />
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

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  grantedContainer: {
    borderWidth: 2,
    borderColor: successColor,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  grantedText: {
    color: successColor,
    fontSize: 18,
    marginBottom: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  step: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeStep: {
    backgroundColor: '#fff',
    width: 30,
  },
  completedStep: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
