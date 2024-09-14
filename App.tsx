import { Navigation } from './src/app/navigation';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from 'react-query';
import { RevenueCatProvider } from './src/app/providers/RevenueCatProvider';
import { getLocales } from 'expo-localization';
import i18n from './src/localization/i18n';
import mobileAds from 'react-native-google-mobile-ads';
import requestTrackingPermissionsAsync from 'react-native-google-mobile-ads';
import { useEffect } from 'react';
import { UserProvider } from './src/app/providers/UserProvider';
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Keep data fresh for 10 minutes
        cacheTime: 15 * 60 * 1000, // Cache data for 15 minutes
        refetchInterval: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  const locales = getLocales();

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

  // Create an AsyncStorage persistor
  const asyncStoragePersistor = createAsyncStoragePersistor({
    storage: AsyncStorage,
  });

  // Persist the query client with AsyncStorage
  persistQueryClient({
    queryClient,
    persistor: asyncStoragePersistor,
    maxAge: 1000 * 60 * 15, // Cache for 24 hours
  });

  // Initialize Google Mobile Ads SDK
  useEffect(() => {
    (async () => {
      // Google AdMob will show any messages here that you just set up on the AdMob Privacy & Messaging page
      const { status: trackingStatus } =
        await requestTrackingPermissionsAsync();
      if (trackingStatus !== 'granted') {
        // Do something here such as turn off Sentry tracking, store in context/redux to allow for personalized ads, etc.
      }

      // Initialize the ads
      await mobileAds().initialize();
    })();
  }, []);

  return (
    <RevenueCatProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <I18nextProvider i18n={i18n}>
            <UserProvider>
              <Navigation />
            </UserProvider>
          </I18nextProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </RevenueCatProvider>
  );
}
