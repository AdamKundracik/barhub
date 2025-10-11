import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { primaryColor, primaryTextColor, secondaryTextColor, warningColor } from '@/src/app/utils/styles/colors';

export const CommunityGuidelines = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <ScreenLayout
      title={t('community-guidelines') || 'Community Guidelines'}
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

        <Text style={styles.intro}>
          BarHub is a community for discovering and sharing experiences at bars and venues. To keep our community safe and welcoming, please follow these guidelines.
        </Text>

        <Text style={styles.sectionTitle}>✅ Do's - What You Should Do</Text>
        <Text style={styles.paragraph}>
          • Post authentic photos of bars and venues{'\n'}
          • Be respectful to other users{'\n'}
          • Provide accurate occupancy information{'\n'}
          • Report inappropriate content{'\n'}
          • Give credit when sharing others' content{'\n'}
          • Use real-time location data responsibly
        </Text>

        <Text style={styles.sectionTitle}>❌ Don'ts - What's Prohibited</Text>
        <Text style={[styles.paragraph, { color: warningColor }]}>
          • Nudity or sexually explicit content{'\n'}
          • Hate speech, harassment, or bullying{'\n'}
          • Violence or graphic content{'\n'}
          • Spam or misleading information{'\n'}
          • Impersonation or fake accounts{'\n'}
          • Copyright infringement{'\n'}
          • Illegal activities or promotion thereof{'\n'}
          • Private information of others{'\n'}
          • Coordinated inauthentic behavior
        </Text>

        <Text style={styles.sectionTitle}>📸 Photo Guidelines</Text>
        <Text style={styles.paragraph}>
          • Photos should show the actual venue/bar{'\n'}
          • Avoid posting photos of individuals without consent{'\n'}
          • No misleading or manipulated images{'\n'}
          • Respect venue policies on photography{'\n'}
          • Occupancy indicators should be accurate
        </Text>

        <Text style={styles.sectionTitle}>⭐ Premium Features</Text>
        <Text style={styles.paragraph}>
          • Premium users get additional highlights for their posts{'\n'}
          • Use premium features responsibly{'\n'}
          • No spam or promotional abuse
        </Text>

        <Text style={styles.sectionTitle}>🚩 Reporting & Moderation</Text>
        <Text style={styles.paragraph}>
          • Report content that violates these guidelines{'\n'}
          • Our moderation team reviews all reports{'\n'}
          • False reports may result in account restrictions{'\n'}
          • We reserve the right to remove content and suspend accounts
        </Text>

        <Text style={styles.sectionTitle}>⚠️ Consequences of Violations</Text>
        <Text style={styles.paragraph}>
          Violations may result in:{'\n'}
          • Content removal{'\n'}
          • Temporary account suspension{'\n'}
          • Permanent account ban{'\n'}
          • Loss of premium features{'\n'}
          • Legal action in severe cases
        </Text>

        <Text style={styles.sectionTitle}>📧 Contact</Text>
        <Text style={styles.paragraph}>
          Questions about these guidelines? Contact us at: community@barhub.app
        </Text>

        <Text style={styles.footer}>
          These guidelines may be updated periodically. Continued use of the App indicates acceptance of any changes.
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
    marginBottom: 16,
  },
  intro: {
    fontSize: 14,
    color: primaryTextColor,
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic',
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
  footer: {
    fontSize: 12,
    color: secondaryTextColor,
    lineHeight: 18,
    marginTop: 32,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default CommunityGuidelines;

