import { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { emailVerificationService } from '../../services/emailVerificationService';
import { useAuth } from '../../providers/AuthProvider';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '../../utils/styles/colors';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Center } from '@/components/ui/center';
import { Divider } from '@/components/ui/divider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Icons from '@fortawesome/free-solid-svg-icons';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const EmailNotVerified = () => {
  const { t } = useTranslation();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { user, refreshUser, logout } = useAuth();

  const userEmail = user?.email || '';

  const checkEmailVerification = async () => {
    if (!user || checking) return;
    try {
      setChecking(true);
      await refreshUser();
      setTimeout(() => {
        showErrorToast(
          t('not-verified-yet') || 'Not verified yet',
          t('please-check-email') ||
            'Please check your email and click the verification link.'
        );
        setChecking(false);
      }, 500);
    } catch (error) {
      console.error('Error checking email verification:', error);
      showErrorToast(t('error'), t('something-went-wrong'));
      setChecking(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user || resending) return;
    setResending(true);
    try {
      await emailVerificationService.resendVerificationEmail();
      showSuccessToast(
        t('verification-email-resent'),
        t('verification-email-resent-desc')
      );
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      let errorMessage = t('please-try-again-later');
      if (
        error.message?.includes('too many') ||
        error.message?.includes('rate limit')
      ) {
        errorMessage = t('too-many-requests');
      } else if (
        error.message?.includes('expired') ||
        error.message?.includes('session')
      ) {
        errorMessage = t('session-expired');
      } else if (error.message?.includes('network')) {
        errorMessage = t('network-error');
      } else if (error.message) {
        errorMessage = error.message;
      }
      showErrorToast(t('email-verification-error'), errorMessage);
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t('logout'), t('sign-out-info'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Error signing out:', error);
            showErrorToast(t('error'), t('something-went-wrong'));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* SVG pozadie – cez celý screen vrátane safe area */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 393 852"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="orangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FF9050" />
            <Stop offset="50%" stopColor="#FF6A5C" />
            <Stop offset="100%" stopColor="#FF5080" />
          </LinearGradient>
          <LinearGradient id="pinkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF40AA" />
            <Stop offset="100%" stopColor="#E940B5" />
          </LinearGradient>
        </Defs>

        {/* Ružová diagonálna čiara */}
        <Path
          d="M -20 900 L 420 380"
          stroke="url(#pinkGrad)"
          strokeWidth={60}
          strokeLinecap="butt"
          fill="none"
        />

        {/* Oranžová slučka */}
        <Path
          d="M -20 220 C 100 -50 350 -50 380 300 C 400 550 250 800 150 900"
          stroke="url(#orangeGrad)"
          strokeWidth={60}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* SafeAreaView transparentný – obsah rešpektuje notch/home bar */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Icon */}
          <Center style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <FontAwesomeIcon
                icon={Icons.faEnvelope}
                size={48}
                color={primaryColor}
              />
            </View>
          </Center>

          {/* Content Card */}
          <View style={styles.card}>
            <VStack space="lg">
              <Center>
                <Text style={styles.title}>
                  {t('email-verification-required')}
                </Text>
              </Center>

              <View style={styles.emailBox}>
                <Text style={styles.emailLabel}>
                  {t('verification-email-sent')}
                </Text>
                <Text style={styles.emailText}>{userEmail}</Text>
              </View>

              <Divider style={styles.divider} />

              <VStack space="md">
                <HStack space="sm" style={styles.instructionRow}>
                  <FontAwesomeIcon
                    icon={Icons.faCircleCheck}
                    size={20}
                    color={primaryColor}
                  />
                  <Text style={styles.instructionText}>{t('check-inbox')}</Text>
                </HStack>
                <HStack space="sm" style={styles.instructionRow}>
                  <FontAwesomeIcon
                    icon={Icons.faCircleExclamation}
                    size={20}
                    color={warningColor}
                  />
                  <Text style={styles.instructionText}>{t('check-spam')}</Text>
                </HStack>
              </VStack>

              <Divider style={styles.divider} />

              <VStack space="md">
                <Center>
                  <Button
                    variant="solid"
                    size="lg"
                    style={styles.checkButton}
                    onPress={checkEmailVerification}
                    isDisabled={checking}
                  >
                    <HStack space="sm" style={styles.buttonContent}>
                      <FontAwesomeIcon
                        icon={Icons.faRotate}
                        size={16}
                        color={'#000'}
                      />
                      <ButtonText style={styles.checkButtonText}>
                        {checking
                          ? t('checking') || 'Checking...'
                          : t('check-verification') || 'I verified my email'}
                      </ButtonText>
                    </HStack>
                  </Button>
                </Center>

                <Center>
                  <Text style={styles.didntReceiveText}>
                    {t('didnt-receive-email')}
                  </Text>
                  <Button
                    variant="outline"
                    size="lg"
                    style={styles.resendButton}
                    onPress={handleResendVerification}
                    isDisabled={resending}
                  >
                    <HStack space="sm" style={styles.buttonContent}>
                      <FontAwesomeIcon
                        icon={Icons.faRotateRight}
                        size={16}
                        color={primaryColor}
                      />
                      <ButtonText style={styles.resendButtonText}>
                        {resending
                          ? t('sending') || 'Sending...'
                          : t('resend-verification')}
                      </ButtonText>
                    </HStack>
                  </Button>
                </Center>
              </VStack>
            </VStack>
          </View>

          {/* Sign Out */}
          <Button
            variant="solid"
            size="lg"
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <HStack space="sm" style={styles.buttonContent}>
              <FontAwesomeIcon
                icon={Icons.faArrowRightFromBracket}
                size={16}
                color={warningColor}
              />
              <ButtonText style={styles.signOutButtonText}>
                {t('logout')}
              </ButtonText>
            </HStack>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Celý screen – základ pre SVG pozadie
  root: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  // Transparentný SafeAreaView – rešpektuje notch ale neblokuje SVG
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${primaryColor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${primaryColor}30`,
  },
  card: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryTextColor,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 8,
  },
  emailBox: {
    backgroundColor: `${primaryColor}10`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${primaryColor}30`,
  },
  emailLabel: {
    fontSize: 14,
    color: secondaryTextColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryColor,
    textAlign: 'center',
  },
  divider: {
    backgroundColor: primaryColor,
    opacity: 0.2,
    marginVertical: 8,
  },
  instructionRow: {
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  instructionText: {
    fontSize: 14,
    color: primaryTextColor,
    flex: 1,
    lineHeight: 20,
  },
  didntReceiveText: {
    fontSize: 14,
    color: secondaryTextColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  checkButton: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 280,
    shadowColor: primaryColor,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    borderColor: primaryColor,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 250,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    borderColor: warningColor,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  signOutButtonText: {
    color: warningColor,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmailNotVerified;
