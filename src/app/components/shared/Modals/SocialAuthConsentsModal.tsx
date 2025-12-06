import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../../utils/styles/themeColors';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { consentService } from '../../../services/consentService';

interface SocialAuthConsentsModalProps {
  visible: boolean;
  provider: 'google' | 'apple';
  userName: string;
  onAccept: (versions: Record<string, string>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SocialAuthConsentsModal: React.FC<
  SocialAuthConsentsModalProps
> = ({
  visible,
  provider,
  userName,
  onAccept,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);
  const [acceptsCommunity, setAcceptsCommunity] = useState(false);
  const [consentVersions, setConsentVersions] = useState<
    Record<string, string>
  >({
    TERMS_OF_SERVICE: '1.0',
    PRIVACY_POLICY: '1.0',
    COMMUNITY_GUIDELINES: '1.0',
  });

  // Fetch current versions on mount
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const versions = await consentService.getCurrentVersions();
        setConsentVersions(versions);
      } catch (error) {
        console.error('Error fetching consent versions:', error);
      }
    };

    if (visible) {
      fetchVersions();
    }
  }, [visible]);

  const isFormValid = acceptsTerms && acceptsPrivacy && acceptsCommunity;

  const handleAccept = () => {
    if (!isFormValid) return;
    onAccept(consentVersions);
  };

  const providerName = provider === 'google' ? 'Google' : 'Apple';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.postBgColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primaryTextColor }]}>
              {t('welcome-to-barhub')} 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
              {t('social-auth-welcome-message', {
                provider: providerName,
                name: userName,
              })}
            </Text>
          </View>

          {/* Legal Agreements */}
          <View style={styles.agreementsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primaryTextColor }]}>
              {t('legal-agreements')}
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: colors.secondaryTextColor }]}
            >
              {t('please-accept-to-continue')}
            </Text>

            {/* Terms of Service */}
            <View style={styles.checkboxRow}>
              <BouncyCheckbox
                size={24}
                fillColor={colors.primaryColor}
                iconStyle={{ borderColor: colors.primaryColor, borderRadius: 4 }}
                innerIconStyle={{ borderWidth: 2, borderRadius: 4 }}
                isChecked={acceptsTerms}
                onPress={() => setAcceptsTerms(!acceptsTerms)}
                useBuiltInState={false}
                disableText
                style={styles.checkbox}
              />
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxText, { color: colors.primaryTextColor }]}>
                  {t('i-accept')}{' '}
                  <Text style={[styles.linkText, { color: colors.primaryColor }]}>{t('terms-of-service')}</Text>{' '}
                  (v{consentVersions['TERMS_OF_SERVICE']})
                </Text>
              </View>
            </View>

            {/* Privacy Policy */}
            <View style={styles.checkboxRow}>
              <BouncyCheckbox
                size={24}
                fillColor={colors.primaryColor}
                iconStyle={{ borderColor: colors.primaryColor, borderRadius: 4 }}
                innerIconStyle={{ borderWidth: 2, borderRadius: 4 }}
                isChecked={acceptsPrivacy}
                onPress={() => setAcceptsPrivacy(!acceptsPrivacy)}
                useBuiltInState={false}
                disableText
                style={styles.checkbox}
              />
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxText, { color: colors.primaryTextColor }]}>
                  {t('i-accept')}{' '}
                  <Text style={[styles.linkText, { color: colors.primaryColor }]}>{t('privacy-policy')}</Text> (v
                  {consentVersions['PRIVACY_POLICY']})
                </Text>
              </View>
            </View>

            {/* Community Guidelines */}
            <View style={styles.checkboxRow}>
              <BouncyCheckbox
                size={24}
                fillColor={colors.primaryColor}
                iconStyle={{ borderColor: colors.primaryColor, borderRadius: 4 }}
                innerIconStyle={{ borderWidth: 2, borderRadius: 4 }}
                isChecked={acceptsCommunity}
                onPress={() => setAcceptsCommunity(!acceptsCommunity)}
                useBuiltInState={false}
                disableText
                style={styles.checkbox}
              />
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxText, { color: colors.primaryTextColor }]}>
                  {t('i-accept')}{' '}
                  <Text style={[styles.linkText, { color: colors.primaryColor }]}>
                    {t('community-guidelines')}
                  </Text>{' '}
                  (v{consentVersions['COMMUNITY_GUIDELINES']})
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.acceptButton,
                { backgroundColor: colors.primaryColor },
                (!isFormValid || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleAccept}
              disabled={!isFormValid || isLoading}
            >
              <Text style={[styles.acceptButtonText, { color: colors.primaryBgColor }]}>
                {isLoading ? t('creating-account') : t('accept-and-continue')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: colors.warningColor },
              ]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.warningColor }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    maxWidth: 450,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  agreementsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginTop: 0,
    marginRight: 0,
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  checkboxText: {
    // color is set inline to use theme colors
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    // color is set inline to use theme colors
    fontWeight: '600',
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
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
