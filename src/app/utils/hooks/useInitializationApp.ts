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
import { useLogsStore } from '../store/logsStore';

export const useAppInitialization = () => {
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const { loadRequests } = useRequestStore();
  const { loadLogs } = useLogsStore();

  // Memoize the initialization function to prevent re-creation
  const initializeBackgroundOperations = useCallback(async () => {
    try {
      // Run these operations in parallel, not sequentially
      await Promise.allSettled([
        initializeTrackingAndAds(),
        loadRequests(),
        loadLogs(),
      ]);
    } catch (error) {
      console.error('Error initializing background operations:', error);
    }
  }, [loadRequests, loadLogs]);

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
      // Request tracking permission (optional - user can deny)
      // Ads will work with or without tracking permission
      const { status } = await getTrackingPermissionsAsync();
      if (status === PermissionStatus.UNDETERMINED) {
        await requestTrackingPermissionsAsync();
      }
      
      // Initialize AdMob - this must be called before using any ad components
      console.log('[AdMob] Initializing AdMob SDK...');
      const initializationStatus = await mobileAds().initialize();
      console.log('[AdMob] AdMob SDK initialized successfully', {
        adapterCount: initializationStatus.length,
        adapters: initializationStatus.map(adapter => ({
          name: adapter.name,
          state: adapter.state,
        })),
      });
      
      // Log environment variables status (for debugging)
      const androidBannerId = process.env.EXPO_PUBLIC_ANDROID_ADMOB_BANNER_ID;
      const iosBannerId = process.env.EXPO_PUBLIC_IOS_ADMOB_BANNER_ID;
      
      console.log('[AdMob] Configuration status:', {
        isDev: __DEV__,
        androidBannerId: androidBannerId ? 'SET' : 'MISSING',
        iosBannerId: iosBannerId ? 'SET' : 'MISSING',
      });
      
      if (!__DEV__) {
        if (!androidBannerId && !iosBannerId) {
          console.error(
            '[AdMob] WARNING: No banner IDs configured! ' +
            'Ads will not display in production. ' +
            'Please set EXPO_PUBLIC_ANDROID_ADMOB_BANNER_ID and EXPO_PUBLIC_IOS_ADMOB_BANNER_ID in eas.json'
          );
        } else {
          console.log('[AdMob] Production banner IDs are configured correctly');
        }
      }
    } catch (error) {
      console.error('[AdMob] Error initializing ads or tracking permissions:', error);
      // Don't throw - allow app to continue even if ads fail to initialize
    }
  };

  return {
    isAppInitialized,
  };
};
