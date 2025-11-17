import { useCallback, useEffect, useState } from 'react';
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

  // Memoize the initialization function to prevent re-creation
  const initializeBackgroundOperations = useCallback(async () => {
    try {
      // Run these operations in parallel, not sequentially
      await Promise.allSettled([
        initializeTrackingAndAds(),
        loadRequests(),
      ]);
    } catch (error) {
      console.error('Error initializing background operations:', error);
    }
  }, [loadRequests]);

  useEffect(() => {
    let isCancelled = false;

    const initializeApp = async () => {
      try {
        // --- Set language (synchronous, fast) ---
        const locales = getLocales();
        const languageCode = locales[0]?.languageCode || 'en';
        const supportedLanguages = ['sk', 'de', 'es', 'en'];
        const language = supportedLanguages.includes(languageCode)
          ? languageCode
          : 'en';
        
        // Make language change non-blocking - set immediately without await
        i18n.changeLanguage(language).catch(error => {
          console.error('Error changing language:', error);
        });

        // Check if component is still mounted before setting state
        if (!isCancelled) {
          // Mark app as initialized immediately - don't wait for non-critical operations
          setIsAppInitialized(true);

          // --- Initialize non-critical operations in background ---
          // These don't block app startup but run after app is ready
          initializeBackgroundOperations();
        }

      } catch (error) {
        console.error('Error initializing app:', error);
        if (!isCancelled) {
          setIsAppInitialized(true); // Allow app to proceed even if error occurs
        }
      }
    };

    initializeApp();

    return () => {
      isCancelled = true;
    };
  }, [initializeBackgroundOperations]);

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
