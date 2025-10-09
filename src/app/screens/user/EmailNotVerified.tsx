import { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  StyleSheet,
  View,
} from 'react-native';
import Layout from '@/src/app/components/shared/Layouts/Layout';
import { useTranslation } from 'react-i18next';
import { emailVerificationService } from '../../services/emailVerificationService';
import { useAuth } from '../../providers/AuthProvider';
import {
  postBgColor,
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
import { useNotificationsHandler } from '@/src/app/components/user/NewsFeed/NotificationHandler';

const EmailNotVerified = () => {
  const { t } = useTranslation();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { unsubscribeNotifications } = useNotificationsHandler();
  const { user, refreshUser, logout } = useAuth();

  const userEmail = user?.email || '';

  // Manual check for email verification
  const checkEmailVerification = async () => {
    if (!user || checking) return;

    try {
      setChecking(true);

      // Refresh user data from backend to get latest emailVerified status
      await refreshUser();

      // Use a small delay to ensure user state is updated in AuthProvider
      setTimeout(() => {
        // AuthProvider will automatically navigate away if email is verified
        // If we're still here after refresh, email is not verified yet
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

  // Check when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          checkEmailVerification();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

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

      // Handle specific errors
      let errorMessage = t('please-try-again-later');

      if (error.message?.includes('too many') || error.message?.includes('rate limit')) {
        errorMessage = t('too-many-requests');
      } else if (error.message?.includes('expired') || error.message?.includes('session')) {
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
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            // Unsubscribe from notifications
            unsubscribeNotifications();

            // Sign out using AuthProvider (push token removal is handled there)
            await logout();

            // Navigation handled by auth state change
          } catch (error) {
            console.error('Error signing out:', error);
            showErrorToast(t('error'), t('something-went-wrong'));
          }
        },
      },
    ]);
  };

  return (
    <Layout pageTitle={t('email-not-verified')}>
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
            {/* Title */}
            <Center>
              <Text style={styles.title}>
                {t('email-verification-required')}
              </Text>
            </Center>

            {/* Email Display */}
            <View style={styles.emailBox}>
              <Text style={styles.emailLabel}>
                {t('verification-email-sent')}
              </Text>
              <Text style={styles.emailText}>{userEmail}</Text>
            </View>

            <Divider style={styles.divider} />

            {/* Instructions */}
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

            {/* Action Buttons */}
            <VStack space="md">
              {/* Check Verification Button */}
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

              {/* Resend Section */}
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

        {/* Sign Out Button */}
        <Button
          variant="outline"
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
    </Layout>
  );
};

const styles = StyleSheet.create({
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
    padding: 24,
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
    marginBottom: 8,
  },
  checkingText: {
    fontSize: 12,
    color: primaryColor,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
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
