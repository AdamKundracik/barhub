/**
 * Privacy & Data Screen
 * GDPR compliance screen for data export and consent management
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useQuery, useQueryClient } from 'react-query';

import { userDataService } from '@/src/app/services/userDataService';
import { consentService } from '@/src/app/services/consentService';
import { Icons } from '@/src/app/utils/icons/icons';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { OutdatedConsentDTO } from '@/src/app/types/dto';
import {
  primaryColor,
  secondaryTextColor,
  separatorColor,
  warningColor,
} from '@/src/app/utils/styles/colors';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';
import { UserStackList } from '@/src/app/utils/types/screen-types';

interface ActionButtonProps {
  icon: any;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'warning' | 'premium';
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  title,
  description,
  onPress,
  variant = 'default',
  disabled = false,
}) => {
  const themeColors = useThemeColors();
  
  const getVariantColors = () => {
    switch (variant) {
      case 'warning':
        return {
          background: 'rgba(254, 120, 120, 0.1)',
          border: 'rgba(254, 120, 120, 0.3)',
          iconColor: warningColor,
          textColor: warningColor,
        };
      case 'premium':
        return {
          background: 'rgba(255, 193, 7, 0.1)',
          border: 'rgba(255, 193, 7, 0.3)',
          iconColor: '#FFC107',
          textColor: '#FFC107',
        };
      default:
        return {
          background: 'rgba(16, 217, 185, 0.08)',
          border: 'rgba(16, 217, 185, 0.2)',
          iconColor: primaryColor,
          textColor: themeColors.primaryTextColor,
        };
    }
  };

  const variantColors = getVariantColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        {
          backgroundColor: disabled
            ? 'rgba(128, 128, 128, 0.1)'
            : variantColors.background,
          borderColor: disabled ? 'rgba(128, 128, 128, 0.2)' : variantColors.border,
        },
      ]}
    >
      <View style={styles.actionButtonIcon}>
        <FontAwesomeIcon
          icon={icon}
          size={20}
          color={disabled ? '#888' : variantColors.iconColor}
        />
      </View>
      <View style={styles.actionButtonContent}>
        <Text
          style={[
            styles.actionButtonTitle,
            { color: disabled ? '#888' : variantColors.textColor },
          ]}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={[
              styles.actionButtonDescription,
              { color: disabled ? '#666' : secondaryTextColor },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
      <FontAwesomeIcon
        icon={Icons.ChevronRight}
        size={16}
        color={disabled ? '#666' : secondaryTextColor}
      />
    </Pressable>
  );
};

export const PrivacyData: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { getUserId } = useUserStore();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { setPendingConsents } = useAuth();
  const queryClient = useQueryClient();
  const colors = useThemeColors();

  const userId = getUserId();

  const [isExporting, setIsExporting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Fetch current consent status
  const { data: consentStatus, isLoading: isLoadingConsents } = useQuery(
    ['consents', userId],
    () => consentService.getConsentStatus(userId?.toString() || ''),
    {
      enabled: !!userId,
    }
  );

  /**
   * Export all user data to JSON file
   * GDPR Right to Access
   */
  const handleExportData = async () => {
    try {
      setIsExporting(true);

      // 1. Fetch data from backend
      const exportData = await userDataService.exportUserData();

      // 2. Convert to formatted JSON
      const jsonString = JSON.stringify(exportData, null, 2);

      // 3. Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `barhub_data_export_${timestamp}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // 4. Save to file
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 5. Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('privacy.export-my-data'),
          UTI: 'public.json',
        });
      } else {
        Alert.alert(
          t('privacy.export-success'),
          `${t('privacy.file-saved-to')}: ${fileUri}`
        );
      }

      showSuccessToast(
        t('privacy.export-success'),
        t('privacy.export-success-message')
      );
    } catch (error: any) {
      console.error('Export failed:', error);
      showErrorToast(
        t('privacy.export-failed'),
        error.message || t('privacy.export-failed-message')
      );
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Withdraw all consents
   * GDPR Right to Object
   *
   * ⚠️ This is a serious action - user will need to re-accept or delete account
   */
  const handleWithdrawConsents = () => {
    Alert.alert(
      t('privacy.withdraw-consents'),
      t('privacy.withdraw-consents-warning'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('privacy.withdraw'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsWithdrawing(true);

              // 1. Withdraw all consents
              await userDataService.withdrawAllConsents(
                userId?.toString() || ''
              );

              // 2. Fetch updated consent status from backend
              const updatedStatus = await consentService.getConsentStatus(
                userId?.toString() || ''
              );

              // 3. Transform to OutdatedConsentDTO[] and set pending consents
              const outdated: OutdatedConsentDTO[] = updatedStatus.consents
                .filter(c => !c.accepted || c.needsUpdate)
                .map(c => ({
                  consentType: c.consentType,
                  currentVersion: c.currentVersion,
                  userAcceptedVersion: c.acceptedVersion,
                  needsUpdate: c.needsUpdate,
                }));

              // 4. Set pending consents to trigger modal
              setPendingConsents(outdated);

              // 5. Invalidate consent cache
              queryClient.invalidateQueries(['consents']);

              showSuccessToast(
                t('privacy.consents-withdrawn'),
                t('privacy.consents-withdrawn-message')
              );

              // 6. Navigate back - modal will appear automatically
              navigation.goBack();
            } catch (error: any) {
              console.error('Withdrawal failed:', error);
              showErrorToast(
                t('privacy.withdrawal-failed'),
                error.message || t('privacy.withdrawal-failed-message')
              );
            } finally {
              setIsWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  /**
   * View current consents
   */
  const handleViewConsents = () => {
    if (!consentStatus) return;

    const consentSummary = consentStatus.consents
      .map(
        c =>
          `${c.consentType}: v${c.acceptedVersion || t('not-accepted')} (${
            c.accepted ? t('accepted') : t('not-accepted')
          })`
      )
      .join('\n');

    Alert.alert(t('privacy.your-consents'), consentSummary);
  };

  return (
    <ScreenLayout
      showTitle
      title={t('privacy.privacy-and-data')}
      showBackButton
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesomeIcon
            icon={Icons.ShieldHalved}
            size={48}
            color={primaryColor}
          />
          <Text style={[styles.headerTitle, { color: colors.primaryTextColor }]}>
            {t('privacy.your-privacy-matters')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('privacy.privacy-data-description')}
          </Text>
        </View>

        {/* GDPR Rights Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primaryTextColor }]}>{t('privacy.your-rights')}</Text>

          {/* Export Data */}
          <ActionButton
            icon={Icons.Download}
            title={t('privacy.export-my-data')}
            description={t('privacy.export-my-data-desc')}
            onPress={handleExportData}
            disabled={isExporting}
            variant="default"
          />
          {isExporting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
              <Text style={styles.loadingText}>{t('privacy.exporting')}</Text>
            </View>
          )}

          {/* View Consents */}
          <ActionButton
            icon={Icons.FileLines}
            title={t('privacy.view-my-consents')}
            description={t('privacy.view-my-consents-desc')}
            onPress={handleViewConsents}
            disabled={isLoadingConsents}
            variant="default"
          />

          {/* Withdraw Consents */}
          <ActionButton
            icon={Icons.Ban}
            title={t('privacy.withdraw-consents')}
            description={t('privacy.withdraw-consents-desc')}
            onPress={handleWithdrawConsents}
            disabled={isWithdrawing}
            variant="warning"
          />
          {isWithdrawing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
              <Text style={styles.loadingText}>{t('privacy.withdrawing')}</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.primaryTextColor }]}>
            {t('privacy.what-is-data-export')}
          </Text>
          <Text style={styles.infoText}>
            {t('privacy.data-export-explanation')}
          </Text>

          <Text style={[styles.infoTitle, { color: colors.primaryTextColor }]}>
            {t('privacy.what-is-consent-withdrawal')}
          </Text>
          <Text style={styles.infoText}>
            {t('privacy.consent-withdrawal-explanation')}
          </Text>

          <Text style={[styles.infoTitle, { color: colors.primaryTextColor }]}>{t('privacy.your-gdpr-rights')}</Text>
          <Text style={styles.infoText}>
            {t('privacy.gdpr-rights-explanation')}
          </Text>
        </View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <Text style={[styles.legalTitle, { color: colors.primaryTextColor }]}>{t('legal-documents')}</Text>
          <ActionButton
            icon={Icons.FileContract}
            title={t('terms-of-service')}
            onPress={() => navigation.navigate('TermsOfService')}
            variant="default"
          />
          <ActionButton
            icon={Icons.ShieldHalved}
            title={t('privacy-policy')}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            variant="default"
          />
          <ActionButton
            icon={Icons.Users}
            title={t('community-guidelines')}
            onPress={() => navigation.navigate('CommunityGuidelines')}
            variant="default"
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: separatorColor,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    // color is set inline to use theme colors
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    // color is set inline to use theme colors
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionButtonDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: secondaryTextColor,
    marginLeft: 8,
  },
  infoSection: {
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color is set inline to use theme colors
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: secondaryTextColor,
    lineHeight: 20,
    marginBottom: 8,
  },
  legalSection: {
    marginBottom: 40,
  },
  legalTitle: {
    fontSize: 20,
    fontWeight: '600',
    // color is set inline to use theme colors
    marginBottom: 16,
  },
});
