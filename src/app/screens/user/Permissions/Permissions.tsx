import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Animated, { FadeIn } from 'react-native-reanimated';
import { usePermissionsContext } from '../../../providers/PermissionsProvider';
import { usePermissionStep } from '../../../utils/hooks/usePermissionStep';
import { getRequiredPermissions } from '../../../utils/constants/permissions';
import { Loading } from '../../Loading';
import { Icons } from '../../../utils/icons/icons';
import { PermissionCard } from './PermissionsCard';
import { NavigationControls } from './NavigationControls';

export const PermissionsScreen = () => {
  const { t } = useTranslation();
  const {
    permissions,
    requestPermission,
    checkAllPermissions,
    isLoading,
    hasAllRequiredPermissions,
  } = usePermissionsContext();

  const {
    currentStep,
    handlePermissionRequest,
    goToNextStep,
    goToPreviousStep,
  } = usePermissionStep();

  const requiredPermissions = getRequiredPermissions();

  if (isLoading) return <Loading />;

  if (hasAllRequiredPermissions()) {
    return (
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
        <Animated.View entering={FadeIn} style={styles.completedContainer}>
          <FontAwesomeIcon icon={Icons.CheckCircle} size={120} color="#fff" />
          <Text style={styles.completedTitle}>
            {t('permissions.allGranted')}
          </Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  const currentPermissionConfig = requiredPermissions[currentStep];
  const isCurrentPermissionGranted = permissions[currentPermissionConfig.key];

  const handleRequestPermission = () => {
    handlePermissionRequest(currentPermissionConfig.key, () =>
      requestPermission(currentPermissionConfig.key)
    );
  };

  return (
    <LinearGradient
      colors={currentPermissionConfig.gradient}
      style={styles.wrapper}
    >
      <View style={styles.container}>
        <PermissionCard
          config={currentPermissionConfig}
          isGranted={isCurrentPermissionGranted}
          onRequestPermission={handleRequestPermission}
          currentStep={currentStep}
          totalSteps={requiredPermissions.length}
        />

        <NavigationControls
          currentStep={currentStep}
          totalSteps={requiredPermissions.length}
          onPrevious={goToPreviousStep}
          onNext={() => goToNextStep(requiredPermissions.length)}
        />

        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={checkAllPermissions}
          >
            <Text style={styles.confirmButtonText}>
              {t('permissions.check-for-permissions')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    maxWidth: 500,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
});
