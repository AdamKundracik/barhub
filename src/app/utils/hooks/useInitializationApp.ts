import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getLocales } from 'expo-localization';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import mobileAds from 'react-native-google-mobile-ads';
import i18n from '../../../localization/i18n';
import { useRequestStore } from '../store/requestStore';
import { useUserStore } from '../store/userStore';
import { useLocationStore } from '../store/locationStore';
import { getCurrentUser } from '../services/functions';
import { auth } from '@/firebaseConfig';

export const useAppInitialization = () => {
  const [authUser, setAuthUser] = useState<null | boolean>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      try {
        setAuthUser(!!user);
        setEmailVerified(user?.emailVerified ?? false);
        setIsAuthLoading(false);

        if (user) {
          // Fetch user data only when user is authenticated
          const userData = await getCurrentUser();
          if (userData) {
            // Populate user store
            useUserStore.getState().setUserData(userData);

            // Populate location store
            useLocationStore.getState().setLocation(userData.location);
            useLocationStore.getState().setFakeLocation(userData.fakeLocation);
            useLocationStore
              .getState()
              .setUseFakeLocation(userData.isUsingFakeLocation ?? false);
            useLocationStore
              .getState()
              .setFakeLocationName(userData.fakeLocationName);
            useLocationStore.getState().setInitialized(true);
          } else {
            console.warn('No userData returned from getCurrentUser');
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setIsAuthLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

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
    authUser,
    emailVerified,
    isAuthLoading,
    isAppInitialized,
    currentUser: auth.currentUser,
  };
};
