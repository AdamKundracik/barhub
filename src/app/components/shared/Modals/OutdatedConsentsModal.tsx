import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../../utils/styles/themeColors';
import { OutdatedConsentDTO } from '@/src/app/types';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { getLegalDocumentContent } from '../../../utils/constants/legalDocuments';

interface OutdatedConsentsModalProps {
  visible: boolean;
  outdatedConsents: OutdatedConsentDTO[];
  onAccept: () => void;
  onLogout: () => void;
  isLoading?: boolean;
}

export const OutdatedConsentsModal: React.FC<OutdatedConsentsModalProps> = ({
  visible,
  outdatedConsents,
  onAccept,
  onLogout,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  // State for individual checkboxes
  const [acceptedConsents, setAcceptedConsents] = useState<
    Record<string, boolean>
  >({});
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);

  const getConsentTitle = (type: string): string => {
    switch (type) {
      case 'TERMS_OF_SERVICE':
        return t('terms-of-service');
      case 'PRIVACY_POLICY':
        return t('privacy-policy');
      case 'COMMUNITY_GUIDELINES':
        return t('community-guidelines');
      default:
        return type;
    }
  };

  const getConsentRoute = (type: string): string => {
    switch (type) {
      case 'TERMS_OF_SERVICE':
        return 'TermsOfService';
      case 'PRIVACY_POLICY':
        return 'PrivacyPolicy';
      case 'COMMUNITY_GUIDELINES':
        return 'CommunityGuidelines';
      default:
        return 'TermsOfService';
    }
  };

  const toggleConsent = (type: string) => {
    setAcceptedConsents(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const toggleAll = () => {
    const allAccepted = outdatedConsents.every(
      c => acceptedConsents[c.consentType]
    );
    const newState: Record<string, boolean> = {};
    outdatedConsents.forEach(c => {
      newState[c.consentType] = !allAccepted;
    });
    setAcceptedConsents(newState);
  };

  const allAccepted = outdatedConsents.every(
    c => acceptedConsents[c.consentType]
  );
  const canSubmit = allAccepted && !isLoading;

  const getDocumentContent = (type: string): string => {
    const consent = outdatedConsents.find(c => c.consentType === type);
    const version = consent?.currentVersion || '1.0';

    return getLegalDocumentContent(
      type as 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES',
      version
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {!viewingDocument ? (
          // Main Consent View
          <View
            style={[styles.container, { backgroundColor: colors.postBgColor }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.primaryTextColor }]}>
                {t('consents-updated')}
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.secondaryTextColor }]}
              >
                {t('consents-updated-message')}
              </Text>
            </View>

            {/* Accept All Checkbox */}
            <View style={styles.acceptAllContainer}>
              <BouncyCheckbox
                size={24}
                fillColor={colors.primaryColor}
                unFillColor="transparent"
                iconStyle={{
                  borderColor: colors.primaryColor,
                  borderRadius: 4,
                }}
                innerIconStyle={{ borderWidth: 2, borderRadius: 4 }}
                isChecked={allAccepted}
                onPress={toggleAll}
                useBuiltInState={false}
                disableText
                style={styles.checkbox}
              />
              <Text
                style={[
                  styles.acceptAllText,
                  { color: colors.primaryTextColor },
                ]}
              >
                {t('accept-all')}
              </Text>
            </View>

            {/* Outdated Consents List with Checkboxes */}
            <ScrollView style={styles.consentsList}>
              {outdatedConsents.map(consent => (
                <View key={consent.consentType} style={styles.consentItem}>
                  <View style={styles.checkboxRow}>
                    <BouncyCheckbox
                      size={20}
                      fillColor={colors.primaryColor}
                      unFillColor="transparent"
                      iconStyle={{
                        borderColor: colors.primaryColor,
                        borderRadius: 4,
                      }}
                      innerIconStyle={{ borderWidth: 2, borderRadius: 4 }}
                      isChecked={!!acceptedConsents[consent.consentType]}
                      onPress={() => toggleConsent(consent.consentType)}
                      useBuiltInState={false}
                      disableText
                      style={styles.checkbox}
                    />
                    <View style={styles.consentTextContainer}>
                      <TouchableOpacity
                        onPress={() => setViewingDocument(consent.consentType)}
                      >
                        <Text
                          style={[
                            styles.consentTitle,
                            { color: colors.primaryColor },
                          ]}
                        >
                          {getConsentTitle(consent.consentType)}
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.versionText,
                          { color: colors.secondaryTextColor },
                        ]}
                      >
                        {t('version')}:{' '}
                        {consent.userAcceptedVersion || t('not-accepted')} →{' '}
                        {consent.currentVersion}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Notice */}
            <Text style={[styles.notice, { color: colors.secondaryTextColor }]}>
              {t('consents-required-notice')}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.acceptButton,
                  { backgroundColor: colors.primaryColor },
                  !canSubmit && styles.buttonDisabled,
                ]}
                onPress={onAccept}
                disabled={!canSubmit}
              >
                <Text
                  style={[
                    styles.acceptButtonText,
                    { color: colors.primaryBgColor },
                  ]}
                >
                  {isLoading ? t('saving') : t('accept-and-continue')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.logoutButton,
                  { borderColor: colors.warningColor },
                ]}
                onPress={onLogout}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.logoutButtonText,
                    { color: colors.warningColor },
                  ]}
                >
                  {t('signed-out')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Document Viewer View (inside same modal)
          <View
            style={[
              styles.documentContainer,
              { backgroundColor: colors.primaryBgColor },
            ]}
          >
            {/* Document Header */}
            <View style={styles.documentHeader}>
              <Text
                style={[
                  styles.documentTitle,
                  { color: colors.primaryTextColor },
                ]}
              >
                {getConsentTitle(viewingDocument)}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setViewingDocument(null)}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: colors.primaryColor },
                  ]}
                >
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document Content */}
            <ScrollView style={styles.documentScroll}>
              <Text
                style={[
                  styles.documentContent,
                  { color: colors.primaryTextColor },
                ]}
              >
                {getDocumentContent(viewingDocument)}
              </Text>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  acceptAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  acceptAllText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  consentsList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  consentItem: {
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginTop: 0,
    marginRight: 0,
  },
  consentTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  versionText: {
    fontSize: 12,
  },
  notice: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    // backgroundColor set dynamically
  },
  acceptButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Document Viewer Styles (inside same modal)
  documentContainer: {
    width: '100%',
    maxWidth: 500,
    height: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  documentScroll: {
    flex: 1,
    padding: 20,
  },
  documentContent: {
    fontSize: 14,
    lineHeight: 22,
  },
});
