import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '@/src/app/utils/styles/colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { consentService } from '@/src/app/services/consentService';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useUserRole } from '@/src/app/hooks/useUserRole';

interface ConsentVersion {
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES';
  currentVersion: string;
}

export const ConsentManagement = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { isAdmin } = useUserRole();

  const [versions, setVersions] = useState<ConsentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState('');
  const [description, setDescription] = useState('');

  // Protect screen - only admins can access
  if (!isAdmin) {
    return (
      <ScreenLayout
        title={t('admin.consentManagement')}
        showTitle
        showBackButton
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.accessDeniedContainer}>
          <FontAwesomeIcon icon={Icons.Lock} size={64} color={warningColor} />
          <Text style={styles.accessDeniedTitle}>
            {t('admin.accessDenied')}
          </Text>
          <Text style={styles.accessDeniedText}>{t('admin.noPermission')}</Text>
        </View>
      </ScreenLayout>
    );
  }

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const versionsData = await consentService.getCurrentVersions();

      const versionsList: ConsentVersion[] = [
        {
          type: 'TERMS_OF_SERVICE',
          currentVersion: versionsData['TERMS_OF_SERVICE'] || '1.0',
        },
        {
          type: 'PRIVACY_POLICY',
          currentVersion: versionsData['PRIVACY_POLICY'] || '1.0',
        },
        {
          type: 'COMMUNITY_GUIDELINES',
          currentVersion: versionsData['COMMUNITY_GUIDELINES'] || '1.0',
        },
      ];

      setVersions(versionsList);
    } catch (error) {
      console.error('Error loading versions:', error);
      showErrorToast(t('error'), 'Failed to load consent versions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

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

  const handleUpdateVersion = async (type: string) => {
    if (!newVersion || !newVersion.trim()) {
      Alert.alert(t('error'), t('consent.enterNewVersion'));
      return;
    }

    try {
      // Call backend to update version
      // Note: This requires a new endpoint on backend
      Alert.alert(
        t('consent.confirmUpdate'),
        t('consent.confirmUpdateMessage', {
          type: getConsentTitle(type),
          version: newVersion,
        }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('consent.update'),
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await consentService.updateConsentVersion(
                  type as
                    | 'TERMS_OF_SERVICE'
                    | 'PRIVACY_POLICY'
                    | 'COMMUNITY_GUIDELINES',
                  newVersion,
                  description
                );

                if (result.success) {
                  showSuccessToast(
                    t('consent.versionUpdated'),
                    t('consent.versionUpdatedMessage', {
                      type: getConsentTitle(type),
                      version: newVersion,
                    })
                  );

                  // Reload cache
                  await consentService.reloadCache();

                  setEditingType(null);
                  setNewVersion('');
                  setDescription('');
                  await loadVersions();
                } else {
                  throw new Error(result.message || 'Failed to update version');
                }
              } catch (error: any) {
                showErrorToast(
                  t('error'),
                  error?.message || t('consent.failedToUpdate')
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating version:', error);
    }
  };

  const startEditing = (type: string, currentVersion: string) => {
    setEditingType(type);
    setNewVersion(currentVersion);
    setDescription('');
  };

  const cancelEditing = () => {
    setEditingType(null);
    setNewVersion('');
    setDescription('');
  };

  return (
    <ScreenLayout
      title={t('admin.consentManagement')}
      showTitle
      showBackButton
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadVersions}
            tintColor={primaryColor}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <FontAwesomeIcon
            icon={Icons.ShieldHalved}
            size={32}
            color={primaryColor}
          />
          <Text style={styles.headerTitle}>{t('consent.legalDocuments')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('consent.manageVersions')}
          </Text>
        </View>

        {/* Versions List */}
        {versions.map(item => (
          <View
            key={item.type}
            style={[styles.card, { backgroundColor: postBgColor }]}
          >
            {/* Title */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: primaryTextColor }]}>
                {getConsentTitle(item.type)}
              </Text>
              <View style={styles.versionBadge}>
                <Text style={[styles.versionText, { color: primaryColor }]}>
                  v{item.currentVersion}
                </Text>
              </View>
            </View>

            {editingType === item.type ? (
              // Edit Mode
              <View style={styles.editContainer}>
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: secondaryTextColor }]}
                  >
                    {t('consent.newVersion')}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: primaryTextColor, borderColor: primaryColor },
                    ]}
                    placeholder={t('consent.versionPlaceholder')}
                    placeholderTextColor={secondaryTextColor}
                    value={newVersion}
                    onChangeText={setNewVersion}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: secondaryTextColor }]}
                  >
                    {t('consent.description')}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      { color: primaryTextColor, borderColor: primaryColor },
                    ]}
                    placeholder={t('consent.descriptionPlaceholder')}
                    placeholderTextColor={secondaryTextColor}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.cancelButton,
                      { borderColor: warningColor },
                    ]}
                    onPress={cancelEditing}
                  >
                    <Text style={[styles.buttonText, { color: warningColor }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      { backgroundColor: primaryColor },
                    ]}
                    onPress={() => handleUpdateVersion(item.type)}
                  >
                    <Text style={[styles.buttonText, { color: 'black' }]}>
                      {t('consent.update')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // View Mode
              <View style={styles.viewContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: primaryColor }]}
                  onPress={() => startEditing(item.type, item.currentVersion)}
                >
                  <FontAwesomeIcon
                    icon={Icons.Pencil}
                    size={16}
                    color={primaryColor}
                  />
                  <Text
                    style={[styles.actionButtonText, { color: primaryColor }]}
                  >
                    {t('consent.updateVersion')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: 'rgba(16, 217, 185, 0.1)' },
          ]}
        >
          <FontAwesomeIcon icon={Icons.Info} size={20} color={primaryColor} />
          <Text style={[styles.infoText, { color: primaryTextColor }]}>
            {t('consent.updateInfo')}
          </Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryTextColor,
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: secondaryTextColor,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  versionBadge: {
    backgroundColor: 'rgba(16, 217, 185, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewContainer: {
    gap: 12,
  },
  editContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: primaryBgColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryTextColor,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
  },
});

export default ConsentManagement;
