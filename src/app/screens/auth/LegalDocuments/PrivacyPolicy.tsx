import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { primaryColor, primaryTextColor, secondaryTextColor } from '@/src/app/utils/styles/colors';

export const PrivacyPolicy = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <ScreenLayout
      title={t('privacy-policy') || 'Privacy Policy'}
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

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly:{'\n'}
          • Email address{'\n'}
          • Display name{'\n'}
          • Date of birth{'\n'}
          • Profile photo (optional){'\n'}
          • Location data (for finding nearby venues){'\n'}
          • Photos and posts you create{'\n'}
          • Device information and push notification tokens
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to:{'\n'}
          • Provide and improve the App{'\n'}
          • Show you nearby bars and venues based on your location{'\n'}
          • Send you notifications about activity on your posts{'\n'}
          • Process premium subscriptions{'\n'}
          • Prevent fraud and abuse{'\n'}
          • Comply with legal obligations
        </Text>

        <Text style={styles.sectionTitle}>3. Location Data</Text>
        <Text style={styles.paragraph}>
          With your permission, we collect precise location data to show you nearby venues and relevant content. You can disable location access in your device settings at any time.
        </Text>

        <Text style={styles.sectionTitle}>4. Photo & Content Storage</Text>
        <Text style={styles.paragraph}>
          Photos you upload are stored on our servers and may be visible to other users. You retain ownership of your content.
        </Text>

        <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          We use third-party services including:{'\n'}
          • Google Maps API (for location services){'\n'}
          • Cloud storage providers{'\n'}
          • Analytics services{'\n'}
          These services have their own privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights (GDPR)</Text>
        <Text style={styles.paragraph}>
          You have the right to:{'\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate data{'\n'}
          • Request deletion of your data{'\n'}
          • Object to data processing{'\n'}
          • Data portability{'\n'}
          Contact us to exercise these rights.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your data as long as your account is active. After account deletion, we may retain some data for legal compliance purposes.
        </Text>

        <Text style={styles.sectionTitle}>8. Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          The App is not intended for children under 13. We do not knowingly collect data from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact</Text>
        <Text style={styles.paragraph}>
          For privacy questions, contact us at: privacy@barhub.app
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

export default PrivacyPolicy;

