import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from 'react-query';
import { I18nextProvider } from 'react-i18next';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

import { Navigation } from './src/app/navigation';
import { RevenueCatProvider } from './src/app/providers/RevenueCatProvider';
import { UserProvider } from './src/app/providers/UserProvider';
import { PermissionsProvider } from './src/app/providers/PermissionsProvider';
import { AppStateProvider } from './src/app/providers/AppStateProvider';

import i18n from './src/localization/i18n';
import { createQueryClientWithPersistence } from './src/app/utils/hooks/useQueryClient';
import { useAppInitialization } from './src/app/utils/hooks/useInitializationApp';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Create query client with persistence
const queryClient = createQueryClientWithPersistence();

export default function App() {
  // Initialize app (localization, ads, tracking, etc.)
  useAppInitialization();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nextProvider i18n={i18n}>
          <AppStateProvider>
            <PermissionsProvider>
              <UserProvider>
                <RevenueCatProvider>
                  <Navigation />
                </RevenueCatProvider>
              </UserProvider>
            </PermissionsProvider>
          </AppStateProvider>
        </I18nextProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
