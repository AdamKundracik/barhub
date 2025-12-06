import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

interface ThankYouScreenProps {
  onClose?: () => void;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryBgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primaryTextColor }]}>
              {t('subscription.thank-you-title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
              {t('subscription.thank-you-subtitle')}
            </Text>
          </View>

          {/* Premium Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: colors.postBgColor, borderColor: colors.separatorColor }]}>
              <Text style={[styles.badgeTitle, { color: colors.primaryTextColor }]}>
                {t('subscription.premium-badge')}
              </Text>
              <Text style={[styles.badgeSubtitle, { color: colors.secondaryTextColor }]}>
                {t('subscription.yearly-subscription')}
              </Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <Text style={[styles.benefitsTitle, { color: colors.primaryTextColor }]}>
              {t('subscription.premium-benefits')}
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🚫</Text>
                <Text style={[styles.benefitText, { color: colors.secondaryTextColor }]}>
                  {t('subscription.no-ads')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🔓</Text>
                <Text style={[styles.benefitText, { color: colors.secondaryTextColor }]}>
                  {t('subscription.access-all-benefits')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✈️</Text>
                <Text style={[styles.benefitText, { color: colors.secondaryTextColor }]}>
                  {t('subscription.travel-mode')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📊</Text>
                <Text style={[styles.benefitText, { color: colors.secondaryTextColor }]}>
                  {t('subscription.leaderboards')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>⭐</Text>
                <Text style={[styles.benefitText, { color: colors.secondaryTextColor }]}>
                  {t('subscription.more-highlights')}
                </Text>
              </View>
            </View>
          </View>

          {/* Thank you message */}
          <View style={[styles.thankYouMessage, { backgroundColor: colors.postBgColor, borderColor: colors.separatorColor }]}>
            <Text style={[styles.messageText, { color: colors.secondaryTextColor }]}>
              {t('subscription.thank-you-message')}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.primaryColor }]}>
            <Text style={[styles.buttonText, { color: colors.primaryBgColor }]}>{t('subscription.close')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is set inline to use theme colors
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    // color is set inline to use theme colors
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    // color is set inline to use theme colors
    textAlign: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  badge: {
    // backgroundColor and borderColor are set inline to use theme colors
    paddingHorizontal: 36,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 240,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // color is set inline to use theme colors
    letterSpacing: 1,
  },
  badgeSubtitle: {
    fontSize: 14,
    // color is set inline to use theme colors
  },
  benefits: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color is set inline to use theme colors
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  benefitIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    // color is set inline to use theme colors
    flex: 1,
  },
  thankYouMessage: {
    // backgroundColor and borderColor are set inline to use theme colors
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  messageText: {
    fontSize: 14,
    // color is set inline to use theme colors
    lineHeight: 20,
    textAlign: 'center',
  },
  closeButton: {
    // backgroundColor is set inline to use theme colors
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ThankYouScreen;
