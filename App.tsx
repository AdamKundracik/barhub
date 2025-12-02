import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from 'react-query';
import { I18nextProvider } from 'react-i18next';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

import { Navigation } from './src/app/navigation';
import { AuthProvider } from './src/app/providers/AuthProvider';
import { PermissionsProvider } from './src/app/providers/PermissionsProvider';
import { AppStateProvider } from './src/app/providers/AppStateProvider';
import { NetworkProvider } from './src/app/providers/NetworkProvider';

import i18n from './src/localization/i18n';
import { createQueryClientWithPersistence } from './src/app/utils/hooks/useQueryClient';
import { useAppInitialization } from './src/app/utils/hooks/useInitializationApp';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const queryClient = createQueryClientWithPersistence();

export default function App() {
  useAppInitialization();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GluestackUIProvider mode="dark">
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <AuthProvider>
                <NetworkProvider>
                  <AppStateProvider>
                    <PermissionsProvider>
                      <BottomSheetModalProvider>
                        <Navigation />
                      </BottomSheetModalProvider>
                    </PermissionsProvider>
                  </AppStateProvider>
                </NetworkProvider>
              </AuthProvider>
            </I18nextProvider>
          </QueryClientProvider>
        </GluestackUIProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
