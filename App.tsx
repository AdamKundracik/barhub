import { Navigation } from './src/app/navigation';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/localization/i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from 'react-query';

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nextProvider i18n={i18n}>
          <Navigation />
        </I18nextProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
