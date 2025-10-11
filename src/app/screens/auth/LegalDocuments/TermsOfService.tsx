import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { primaryColor, primaryTextColor, secondaryTextColor } from '@/src/app/utils/styles/colors';

export const TermsOfService = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <ScreenLayout
      title={t('terms-of-service') || 'Terms of Service'}
      showTitle
      showBackButton
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: October 11, 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using BarHub ("the App"), you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. Use License</Text>
        <Text style={styles.paragraph}>
          Permission is granted to temporarily use the App for personal, non-commercial transitory viewing only.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>4. Content & Posting Rules</Text>
        <Text style={styles.paragraph}>
          Users may post photos and content related to bars and venues. You retain ownership of your content, but grant BarHub a worldwide license to use, display, and distribute your content.
        </Text>

        <Text style={styles.sectionTitle}>5. Premium Subscription & Billing</Text>
        <Text style={styles.paragraph}>
          • Premium subscriptions are billed monthly or annually{'\n'}
          • Payment will be charged to your account at confirmation of purchase{'\n'}
          • Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period{'\n'}
          • Subscriptions may be managed in your Account Settings{'\n'}
          • Cancellation takes effect at the end of the current billing period{'\n'}
          • No refunds for partial periods
        </Text>

        <Text style={styles.sectionTitle}>6. Prohibited Content</Text>
        <Text style={styles.paragraph}>
          Users may not post content that is illegal, offensive, discriminatory, or violates the rights of others.
        </Text>

        <Text style={styles.sectionTitle}>7. Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms.
        </Text>

        <Text style={styles.sectionTitle}>8. Disclaimer</Text>
        <Text style={styles.paragraph}>
          The App is provided "as is" without warranties of any kind. We do not warrant that the App will be uninterrupted or error-free.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms, please contact us at: support@barhub.app
        </Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: secondaryTextColor,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: primaryColor,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: primaryTextColor,
    lineHeight: 22,
    marginBottom: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default TermsOfService;

