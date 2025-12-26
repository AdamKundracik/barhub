import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import DeviceInfo from 'react-native-device-info';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { useNavigation } from '@react-navigation/native';

export default function AppVersion() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [appVersion, setAppVersion] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVersionInfo = () => {
      try {
        const version =
          Constants.expoConfig?.version || DeviceInfo.getVersion() || 'N/A';
        setAppVersion(version);
      } catch (error) {
        console.error('Error loading version info:', error);
        setAppVersion(Constants.expoConfig?.version || 'N/A');
      } finally {
        setIsLoading(false);
      }
    };

    loadVersionInfo();
  }, []);

  return (
    <ScreenLayout
      title={t('app-version-label')}
      showTitle
      showBackButton
      onBackPress={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <Text style={styles.versionNumber}>
          {isLoading ? '...' : appVersion}
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  versionNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
