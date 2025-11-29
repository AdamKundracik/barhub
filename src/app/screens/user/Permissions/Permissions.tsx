import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Animated, {
  FadeIn,
  runOnJS,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { usePermissionsContext } from '../../../providers/PermissionsProvider';
import { getRequiredPermissions } from '../../../utils/constants/permissions';
import { Loading } from '../../../components/shared/Loading';
import { Icons } from '../../../utils/icons/icons';

const { width, height } = Dimensions.get('window');

// Permission Card Component
interface PermissionCardProps {
  config: any;
  isGranted: boolean;
  onRequestPermission: () => void;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  config,
  isGranted,
  onRequestPermission,
}) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 100 });
    });
    runOnJS(onRequestPermission)();
  };


  return (
    <Animated.View
      style={[
        styles.permissionCard,
        animatedStyle,
        isGranted && styles.grantedCard,
      ]}
    >
      <View style={styles.iconContainer}>
        <FontAwesomeIcon icon={config.icon} size={64} color="#fff" />
      </View>

      <Text style={styles.permissionTitle}>{t(config.titleKey)}</Text>
      <Text style={styles.permissionDescription}>
        {t(config.descriptionKey)}
      </Text>

      {isGranted ? (
        <View style={styles.grantedContainer}>
          <FontAwesomeIcon icon={Icons.CheckCircle} size={24} color="#4CAF50" />
          <Text style={styles.grantedText}>{t('permissions.granted')}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={handlePress}>
          <Text style={styles.primaryButtonText}>
            {t('permissions.grant')}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export const PermissionsScreen = () => {
  const { t } = useTranslation();
  const {
    permissions,
    requestPermission,
    checkAllPermissions,
    isLoading,
    hasAllRequiredPermissions,
  } = usePermissionsContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [animationKey, setAnimationKey] = useState(0);
  const requiredPermissions = getRequiredPermissions();
  const insets = useSafeAreaInsets();

  // Manual navigation only - no auto-advance

  if (isLoading) return <Loading />;

  // Success screen with celebration
  if (hasAllRequiredPermissions()) {
    return (
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={[
          styles.wrapper,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.successContainer}
        >
          <Animated.View
            entering={FadeIn.delay(200).duration(800)}
            style={styles.successIconContainer}
          >
            <FontAwesomeIcon icon={Icons.CheckCircle} size={80} color="#fff" />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(400).duration(600)}
            style={styles.successTitle}
          >
            {t('permissions.allGranted')}
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(600).duration(600)}
            style={styles.successSubtitle}
          >
            {t('permissions.readyToUse')}
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(800).duration(600)}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={checkAllPermissions}
            >
              <Text style={styles.getStartedButtonText}>
                {t('permissions.getStarted')}
              </Text>
              <FontAwesomeIcon icon={Icons.Right} size={20} color="#4CAF50" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    );
  }

  const currentPermissionConfig = requiredPermissions[currentStep];
  const isCurrentPermissionGranted = permissions[currentPermissionConfig.key];
  const progress = ((currentStep + 1) / requiredPermissions.length) * 100;
  const grantedCount = requiredPermissions.filter(
    p => permissions[p.key]
  ).length;

  const handleRequestPermission = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    try {
      const result = await requestPermission(currentPermissionConfig.key);
      
      if (!result) {
        // Permission was denied, show alert with specific instructions
        const isTracking = currentPermissionConfig.key === 'tracking';
        const messageKey = isTracking 
          ? 'permissions.permissionDeniedMessageTracking' 
          : 'permissions.permissionDeniedMessage';
        
        Alert.alert(
          t('permissions.permissionDenied'),
          t(messageKey),
          [
            { text: t('cancel'), style: 'cancel' },
            { 
              text: t('permissions.openSettings'), 
              onPress: () => {
                Linking.openSettings().catch(err => {
                  console.error('Failed to open settings:', err);
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert(
        t('permissions.error'),
        t('permissions.errorMessage'),
        [{ text: t('ok') }]
      );
    } finally {
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleNext = () => {
    if (currentStep < requiredPermissions.length - 1) {
      setDirection('forward');
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimationKey(prev => prev + 1);
      }, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimationKey(prev => prev + 1);
      }, 0);
    }
  };

  // const handleSkip = () => {
  //   Alert.alert(t('permissions.skipTitle'), t('permissions.skipMessage'), [
  //     { text: t('cancel'), style: 'cancel' },
  //     { text: t('permissions.skipConfirm'), onPress: checkAllPermissions },
  //   ]);
  // };

  return (
    <LinearGradient
      colors={currentPermissionConfig.gradient as any}
      style={[
        styles.wrapper,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('permissions.welcome')}</Text>
        <Text style={styles.headerSubtitle}>{t('permissions.subtitle')}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {t('permissions.step')} {currentStep + 1} {t('permissions.of')}{' '}
            {requiredPermissions.length}
          </Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>

        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill, { width: `${progress}%` }]}
            entering={FadeIn.duration(300)}
          />
        </View>

        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {requiredPermissions.map((permission, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.activeStepDot,
                index < currentStep && styles.completedStepDot,
                permissions[permission.key] && styles.grantedStepDot,
              ]}
            />
          ))}
        </View>

        {/* Granted count */}
        <Text style={styles.grantedCount}>
          {grantedCount} {t('permissions.of')} {requiredPermissions.length}{' '}
          {t('permissions.granted')}
        </Text>
      </View>

      {/* Permission Card */}
      <View style={styles.cardContainer}>
        <Animated.View
          key={animationKey}
          entering={direction === 'forward' 
            ? SlideInRight.duration(300) 
            : SlideInLeft.duration(300)}
          exiting={direction === 'forward' 
            ? SlideOutLeft.duration(300) 
            : SlideOutRight.duration(300)}
        >
          <PermissionCard
            config={currentPermissionConfig}
            isGranted={isCurrentPermissionGranted}
            onRequestPermission={handleRequestPermission}
          />
        </Animated.View>
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep === 0 && styles.disabledNavButton,
          ]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <FontAwesomeIcon
            icon={Icons.ChevronLeft}
            size={20}
            color={currentStep === 0 ? 'rgba(255,255,255,0.3)' : '#fff'}
          />
          <Text
            style={[
              styles.navButtonText,
              currentStep === 0 && styles.disabledNavButtonText,
            ]}
          >
            {t('permissions.previous')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep === requiredPermissions.length - 1 &&
              styles.disabledNavButton,
          ]}
          onPress={handleNext}
          disabled={currentStep === requiredPermissions.length - 1}
        >
          <Text
            style={[
              styles.navButtonText,
              currentStep === requiredPermissions.length - 1 &&
                styles.disabledNavButtonText,
            ]}
          >
            {t('permissions.next')}
          </Text>
          <FontAwesomeIcon
            icon={Icons.ChevronRight}
            size={20}
            color={
              currentStep === requiredPermissions.length - 1
                ? 'rgba(255,255,255,0.3)'
                : '#fff'
            }
          />
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeStepDot: {
    backgroundColor: '#fff',
    transform: [{ scale: 1.2 }],
  },
  completedStepDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  grantedStepDot: {
    backgroundColor: '#4CAF50',
  },
  grantedCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 280,
    justifyContent: 'center',
  },
  grantedCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    padding: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  permissionDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 12,
    fontWeight: '400',
  },
  grantedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grantedText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
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
  disabledNavButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledNavButtonText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    padding: 20,
    marginBottom: 30,
  },
  successTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  successSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
});
