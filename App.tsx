import { Navigation } from './src/app/navigation';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from 'react-query';
import { RevenueCatProvider } from './src/app/providers/RevenueCatProvider';
import { getLocales } from 'expo-localization';
import i18n from './src/localization/i18n';

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

  console.log(locales);

  return (
    <RevenueCatProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <I18nextProvider i18n={i18n}>
            <Navigation />
          </I18nextProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </RevenueCatProvider>
  );
}
