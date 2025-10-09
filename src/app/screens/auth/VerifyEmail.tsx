import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  postBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '../../utils/styles/colors';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Icons from '@fortawesome/free-solid-svg-icons';
import { emailVerificationService } from '../../services/emailVerificationService';
import { useRoute } from '@react-navigation/native';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { useAuth } from '../../providers/AuthProvider';

export const VerifyEmail = ({ navigation }: any) => {
  const { t } = useTranslation();
  const route = useRoute();
  const { refreshUser, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string>('');

  // Get token from route params (deep link)
  useEffect(() => {
    const params = route.params as any;

    if (params?.token) {
      // Auto-verify when token is available
      verifyEmailWithToken(params.token);
    }
  }, [route.params]);

  const verifyEmailWithToken = async (verificationToken: string) => {
    if (!verificationToken || loading) return;

    setLoading(true);
    setError('');

    try {
      await emailVerificationService.verifyEmail(verificationToken);
      setVerified(true);

      // If user is authenticated, refresh user data to update emailVerified status
      if (isAuthenticated) {
        await refreshUser();
        // Navigation will automatically redirect to main app when emailVerified becomes true
      } else {
        // If not authenticated, redirect to login after 2 seconds
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error verifying email:', error);

      let errorMessage = t('something-went-wrong');
      if (error.message?.includes('expired')) {
        errorMessage =
          t('verification-token-expired') || 'Verification link has expired.';
      } else if (error.message?.includes('invalid')) {
        errorMessage =
          t('verification-token-invalid') || 'Invalid verification link.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeAreaInner}>
        <View style={styles.container}>
          {/* Icon */}
          <Center style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              {loading ? (
                <ActivityIndicator size="large" color={primaryColor} />
              ) : (
                <FontAwesomeIcon
                  icon={
                    verified ? Icons.faCheckCircle : Icons.faExclamationCircle
                  }
                  size={64}
                  color={verified ? primaryColor : warningColor}
                />
              )}
            </View>
          </Center>

          {/* Content Card */}
          <View style={styles.card}>
            <VStack space="lg">
              {/* Title */}
              <Center>
                <Text style={styles.title}>
                  {loading
                    ? t('checking-status') || 'Verifying Email...'
                    : verified
                      ? t('email-verified') || 'Email Verified!'
                      : t('verification-failed') || 'Verification Failed'}
                </Text>
              </Center>

              {/* Status Message */}
              <Center>
                <Text
                  style={[styles.message, error && { color: warningColor }]}
                >
                  {loading
                    ? t('please-wait') ||
                      'Please wait while we verify your email...'
                    : verified
                      ? t('redirecting') || 'Redirecting to login...'
                      : error ||
                        t('verification-error-message') ||
                        'Unable to verify your email. The link may have expired.'}
                </Text>
              </Center>

              {/* Loading Indicator */}
              {loading && (
                <Center>
                  <ActivityIndicator size="large" color={primaryColor} />
                </Center>
              )}

              {/* Error Actions */}
              {error && !loading && (
                <Center>
                  <Button
                    variant="solid"
                    size="lg"
                    style={styles.button}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <HStack space="sm" style={styles.buttonContent}>
                      <FontAwesomeIcon
                        icon={Icons.faArrowLeft}
                        size={16}
                        color={'#000'}
                      />
                      <ButtonText style={styles.buttonText}>
                        {t('back-to-login')}
                      </ButtonText>
                    </HStack>
                  </Button>
                </Center>
              )}
            </VStack>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020213',
  },
  safeAreaInner: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
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
  message: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 280,
    shadowColor: primaryColor,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default VerifyEmail;
