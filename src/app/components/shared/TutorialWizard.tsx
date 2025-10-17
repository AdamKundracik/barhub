import React, { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import {
  primaryBgColor,
  primaryColor,
  separatorColor,
} from '../../utils/styles/colors';
import { useTranslation } from 'react-i18next';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  highlight?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface TutorialWizardProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const TutorialWizard: React.FC<TutorialWizardProps> = ({
  visible,
  onComplete,
  onSkip,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: t('tutorial.welcome.title'),
      description: t('tutorial.welcome.description'),
      icon: Icons.House, // Using House instead of HandWave
    },
    {
      id: 'feed',
      title: t('tutorial.feed.title'),
      description: t('tutorial.feed.description'),
      icon: Icons.House,
    },
    {
      id: 'posts',
      title: t('tutorial.posts.title'),
      description: t('tutorial.posts.description'),
      icon: Icons.Camera,
    },
    {
      id: 'leaderboard',
      title: t('tutorial.leaderboard.title'),
      description: t('tutorial.leaderboard.description'),
      icon: Icons.RankingStar,
    },
    {
      id: 'search',
      title: t('tutorial.search.title'),
      description: t('tutorial.search.description'),
      icon: Icons.Search,
    },
    {
      id: 'profile',
      title: t('tutorial.profile.title'),
      description: t('tutorial.profile.description'),
      icon: Icons.User,
    },
    {
      id: 'complete',
      title: t('tutorial.complete.title'),
      description: t('tutorial.complete.description'),
      icon: Icons.Check,
    },
  ];

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const currentStepData = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              {tutorialSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index <= currentStep ? primaryColor : separatorColor,
                    },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <FontAwesomeIcon
                icon={currentStepData.icon}
                size={80}
                color={primaryColor}
              />
            </View>

            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.description}>
              {currentStepData.description}
            </Text>
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            {!isFirstStep && (
              <TouchableOpacity
                style={[styles.navButton, styles.backButton]}
                onPress={handlePrevious}
              >
                <FontAwesomeIcon
                  icon={Icons.ChevronLeft}
                  size={20}
                  color={primaryColor}
                />
                <Text style={[styles.navButtonText, { color: primaryColor }]}>
                  {t('tutorial.back')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={[styles.navButtonText, { color: '#000' }]}>
                {isLastStep ? t('tutorial.getStarted') : t('tutorial.next')}
              </Text>
              {!isLastStep && (
                <FontAwesomeIcon
                  icon={Icons.ChevronRight}
                  size={20}
                  color="#FFF"
                />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: primaryBgColor,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: separatorColor,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${primaryColor}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: separatorColor,
    textAlign: 'center',
    lineHeight: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: primaryColor,
  },
  nextButton: {
    backgroundColor: primaryColor,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
