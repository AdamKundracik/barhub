import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { primaryColor, primaryTextColor } from '@/src/app/utils/styles/colors';
import { getLegalDocumentContent } from '@/src/app/utils/constants/legalDocuments';
import { LegalDocumentViewer } from '@/src/app/components/shared/LegalDocumentViewer';

export const PrivacyPolicy = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const content = getLegalDocumentContent('PRIVACY_POLICY');

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
    color: primaryTextColor,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default PrivacyPolicy;
