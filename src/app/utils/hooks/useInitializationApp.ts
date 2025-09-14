import { useEffect } from 'react';
import { getLocales } from 'expo-localization';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import mobileAds from 'react-native-google-mobile-ads';
import i18n from '../../../localization/i18n';
import { useRequestStore } from '../store/requestStore';

export const useAppInitialization = () => {
  const { loadRequests } = useRequestStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        loadRequests();

        const locales = getLocales();
        const languageCode = locales[0]?.languageCode || 'en';
        const supportedLanguages = ['sk', 'de', 'es', 'en'];
        const language = supportedLanguages.includes(languageCode)
          ? languageCode
          : 'en';
        await i18n.changeLanguage(language);

        await initializeTrackingAndAds();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, [loadRequests]);
};

const initializeTrackingAndAds = async () => {
  try {
    const { status } = await getTrackingPermissionsAsync();
    if (status === PermissionStatus.UNDETERMINED) {
      await requestTrackingPermissionsAsync();
    }

    await mobileAds().initialize();
  } catch (error) {
    console.error('Error initializing ads or tracking permissions:', error);
  }
};
