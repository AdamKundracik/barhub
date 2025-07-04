import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Navigation } from './src/app/navigation';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from 'react-query';
import { RevenueCatProvider } from './src/app/providers/RevenueCatProvider';
import { getLocales } from 'expo-localization';
import i18n from './src/localization/i18n';
import mobileAds from 'react-native-google-mobile-ads';
import { useEffect } from 'react';
import { UserProvider } from './src/app/providers/UserProvider';
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';
import { PermissionsProvider } from './src/app/providers/PermissionsProvider';
import { AppStateProvider } from './src/app/providers/AppStateProvider';
import { useRequestStore } from './src/app/utils/store/requestStore';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

export default function App() {
  const locales = getLocales();
  const { loadRequests } = useRequestStore();

  // Initialize i18n language based on device locales
  useEffect(() => {
    switch (locales[0].languageCode) {
      case 'sk':
        i18n.changeLanguage('sk');
        break;
      case 'de':
        i18n.changeLanguage('de');
        break;
      case 'es':
        i18n.changeLanguage('es');
        break;
      case 'en':
      default:
        i18n.changeLanguage('en');
        break;
    }
  }, [locales]); // Re-run if locales change, though typically they don't during runtime

  // Restore request cooldowns from AsyncStorage and handle async initializations
  useEffect(() => {
    loadRequests(); // Restore request cooldowns from AsyncStorage

    const initializeAdsAndTracking = async () => {
      try {
        // Request Tracking Transparency permission
        const { status } = await getTrackingPermissionsAsync();
        if (status === PermissionStatus.UNDETERMINED) {
          await requestTrackingPermissionsAsync();
        }

        // Initialize Google Mobile Ads SDK
        const adapterStatuses = await mobileAds().initialize();
        // console.log('Mobile Ads initialized:', adapterStatuses); // Optional: log initialization status
      } catch (error) {
        console.error('Error initializing ads or tracking permissions:', error);
      }
    };

    initializeAdsAndTracking();
  }, []); // Empty dependency array ensures this runs only once on mount

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Keep data fresh indefinitely
        cacheTime: 15 * 60 * 1000, // Cache data for 15 minutes
        refetchInterval: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  // Create an AsyncStorage persistor
  const asyncStoragePersistor = createAsyncStoragePersistor({
    storage: AsyncStorage,
  });

  // Persist the query client with AsyncStorage
  persistQueryClient({
    queryClient,
    persistor: asyncStoragePersistor,
    maxAge: 1000 * 60 * 15, // Cache for 15 minutes
  });

  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false, // Reanimated runs in strict mode by default
  });

  return (
    <RevenueCatProvider>
      <AppStateProvider>
        <PermissionsProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <I18nextProvider i18n={i18n}>
                <UserProvider>
                  <Navigation />
                </UserProvider>
              </I18nextProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </PermissionsProvider>
      </AppStateProvider>
    </RevenueCatProvider>
  );
}
