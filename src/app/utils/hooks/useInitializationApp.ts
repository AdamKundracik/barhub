import { useEffect, useState } from 'react';
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
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const { loadRequests } = useRequestStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // --- Set language ---
        const locales = getLocales();
        const languageCode = locales[0]?.languageCode || 'en';
        const supportedLanguages = ['sk', 'de', 'es', 'en'];
        const language = supportedLanguages.includes(languageCode)
          ? languageCode
          : 'en';
        await i18n.changeLanguage(language);

        // --- Initialize tracking & ads ---
        await initializeTrackingAndAds();

        // --- Load requests ---
        await loadRequests();

        // Mark app as initialized (excluding user-specific data)
        setIsAppInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsAppInitialized(true); // Allow app to proceed even if error occurs
      }
    };

    initializeApp();
  }, [loadRequests]);

  // Note: Auth state management is now handled by AuthProvider

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

  return {
    isAppInitialized,
  };
};
