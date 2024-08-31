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

export default function App() {
  const queryClient = new QueryClient();
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

  // Go inside your component/function

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
