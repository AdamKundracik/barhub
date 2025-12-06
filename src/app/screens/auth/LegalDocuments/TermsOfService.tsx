import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
// Removed color imports - using static colors in StyleSheet
import { getLegalDocumentContent } from '@/src/app/utils/constants/legalDocuments';
import { LegalDocumentViewer } from '@/src/app/components/shared/LegalDocumentViewer';

export const TermsOfService = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const content = getLegalDocumentContent('TERMS_OF_SERVICE');

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
        <LegalDocumentViewer content={content} />

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
  content: {
    fontSize: 14,
    color: '#FFFFFF', // Static color for StyleSheet (dark theme default)
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default TermsOfService;
