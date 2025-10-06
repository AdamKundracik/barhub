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
import { RevenueCatProvider } from './src/app/providers/RevenueCatProvider';
import { PermissionsProvider } from './src/app/providers/PermissionsProvider';
import { AppStateProvider } from './src/app/providers/AppStateProvider';
import { NetworkProvider } from './src/app/providers/NetworkProvider';

import i18n from './src/localization/i18n';
import { createQueryClientWithPersistence } from './src/app/utils/hooks/useQueryClient';
import { useAppInitialization } from './src/app/utils/hooks/useInitializationApp';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const queryClient = createQueryClientWithPersistence();

export default function App() {
  useAppInitialization();

  return (
    <GluestackUIProvider mode="dark">
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>
              <NetworkProvider>
                <AppStateProvider>
                  <PermissionsProvider>
                    <RevenueCatProvider>
                      <BottomSheetModalProvider>
                        <Navigation />
                      </BottomSheetModalProvider>
                    </RevenueCatProvider>
                  </PermissionsProvider>
                </AppStateProvider>
              </NetworkProvider>
            </AuthProvider>
          </I18nextProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
