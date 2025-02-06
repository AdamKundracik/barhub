import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  GestureResponderEvent,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../../utils/hooks/usePermissions';
import {
  requestCameraPermission,
  requestGeolocationPermission,
  requestNotificationPermission,
  requestTrackingPermission,
} from '../../../utils/services/permission.service';
import { Icons } from '../../../utils/icons/icons';
import { Loading } from '../../Loading';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface ArrowButtonProps {
  icon: IconDefinition;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');

export const PermissionsScreen = () => {
  const { t } = useTranslation();
  const { permissions, isLoadingPermissions, checkPermissions } =
    usePermissions();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkPermissions();
  }, []);

  const permissionData = [
    {
      key: 'geolocation',
      icon: Icons.Location,
      gradient: ['#087A72', '#14252A'],
      title: t('permissions.location'),
      description: t('permissions.locationDesc'),
      condition: Platform.OS !== 'web',
    },
    {
      key: 'camera',
      icon: Icons.Camera,
      gradient: ['#010A0D', '#065C55'],
      title: t('permissions.camera'),
      description: t('permissions.cameraDesc'),
      condition: true,
    },
    {
      key: 'notification',
      icon: Icons.Bell,
      gradient: ['#14252A', '#065C55'],
      title: t('permissions.notification'),
      description: t('permissions.notificationDesc'),
      condition: true,
    },
    {
      key: 'tracking',
      icon: Icons.Tracking,
      gradient: ['#065C55', '#5A6A6A'],
      title: t('permissions.tracking'),
      description: t('permissions.trackingDesc'),
      condition: Platform.OS === 'ios',
    },
  ];

  const completeSteps = permissionData.filter(p => p.condition).map(p => p.key);

  const areAllPermissionsGranted = () => {
    return completeSteps.every(
      key => permissions[key as keyof typeof permissions]
    );
  };

  const handlePermissionPress = async (key: string) => {
    type PermissionKey = 'camera' | 'notification' | 'geolocation' | 'tracking';

    const permissionFuncs: Record<PermissionKey, () => Promise<boolean>> = {
      camera: requestCameraPermission,
      notification: requestNotificationPermission,
      geolocation: requestGeolocationPermission,
      tracking:
        Platform.OS === 'ios'
          ? requestTrackingPermission
          : () => Promise.resolve(true),
    };

    try {
      const granted = await permissionFuncs[key as PermissionKey]();

      if (!granted) {
        Alert.alert(
          t('permissions.open-settings'),
          t('permissions.allow-in-settings'),
          [
            {
              text: t('permissions.settings'),
              onPress: () => Linking.openSettings(),
            },
            {
              text: t('cancel'),
              style: 'destructive',
            },
          ]
        );
      } else {
        await checkPermissions();
      }
    } catch (error) {
      console.error(`Error requesting ${key} permission:`, error);
    }
  };

  const handleContinue = async () => {
    if (currentStep < completeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleConfirm = async () => {
    // Double-check permissions before proceeding
    await checkPermissions();
  };

  const isPermissionGranted = (key: string) =>
    permissions[key as keyof typeof permissions] || false;

  const ArrowButton = ({
    icon,
    onPress,
    disabled = false,
  }: ArrowButtonProps) => (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <FontAwesomeIcon
        icon={icon}
        size={24}
        color={disabled ? 'rgba(255,255,255,0.3)' : '#fff'}
      />
    </TouchableOpacity>
  );

  if (isLoadingPermissions) return <Loading />;

  if (completeSteps.length === 0) {
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

  const currentPermission = completeSteps[currentStep];
  const config = permissionData.find(p => p.key === currentPermission)!;

  return (
    <LinearGradient colors={config.gradient} style={styles.wrapper}>
      <View style={styles.container}>
        <Animated.View
          key={currentPermission}
          entering={SlideInRight}
          exiting={SlideOutLeft}
          style={[
            styles.permissionContainer,
            isPermissionGranted(currentPermission) && styles.grantedContainer,
          ]}
        >
          <FontAwesomeIcon icon={config.icon} size={120} color="#fff" />
          <Text style={styles.permissionTitle}>{config.title}</Text>
          <Text style={styles.permissionDescription}>{config.description}</Text>

          {isPermissionGranted(currentPermission) && (
            <Text style={styles.grantedText}>
              {t('permissions.alreadyGranted')}
            </Text>
          )}

          <View style={styles.buttonsContainer}>
            {!isPermissionGranted(currentPermission) && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={() => handlePermissionPress(currentPermission)}
              >
                <Text style={styles.buttonText}>{t('permissions.grant')}</Text>
              </TouchableOpacity>
            )}

            {isPermissionGranted(currentPermission) && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.buttonText}>
                  {t('permissions.continue')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.stepIndicator}>
            {completeSteps.map((key, index) => (
              <View
                key={key}
                style={[
                  styles.step,
                  index === currentStep && styles.activeStep,
                  index < currentStep && styles.completedStep,
                  isPermissionGranted(key) && styles.grantedStep,
                ]}
              />
            ))}
          </View>
          <View style={styles.arrowButtons}>
            <ArrowButton
              icon={Icons.Left}
              onPress={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
            />
            <ArrowButton
              icon={Icons.ChevronRight}
              onPress={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === completeSteps.length - 1}
            />
          </View>
        </Animated.View>

        {areAllPermissionsGranted() && (
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {t('permissions.confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  permissionContainer: {
    width: width * 0.85,
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  grantedContainer: {
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.6)',
  },
  grantedText: {
    color: 'rgba(76, 175, 80, 0.8)',
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
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
  grantedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  continueButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
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
  arrowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  grantedStep: {
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
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
