import React, { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { QueryClientProvider } from 'react-query';
import { I18nextProvider } from 'react-i18next';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

import { Navigation } from './src/app/navigation';
import { AuthProvider } from './src/app/providers/AuthProvider';
import { AppStateProvider } from './src/app/providers/AppStateProvider';
import { NetworkProvider } from './src/app/providers/NetworkProvider';

import i18n from './src/localization/i18n';
import { createQueryClientWithPersistence } from './src/app/utils/hooks/useQueryClient';
import { useAppInitialization } from './src/app/utils/hooks/useInitializationApp';
import { primaryBgColor } from './src/app/utils/styles/colors';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const queryClient = createQueryClientWithPersistence();

// Wrapper to ensure app initialization happens INSIDE providers
const AppInitializationWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  useAppInitialization();
  return <>{children}</>;
};

export default function App() {
  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <StatusBar
          backgroundColor={primaryBgColor}
          barStyle="light-content"
          translucent={false}
        />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GluestackUIProvider mode="dark">
            <QueryClientProvider client={queryClient}>
              <I18nextProvider i18n={i18n}>
                <AuthProvider>
                  <NetworkProvider>
                    <AppStateProvider>
                      <BottomSheetModalProvider>
                        <AppInitializationWrapper>
                          <Navigation />
                        </AppInitializationWrapper>
                      </BottomSheetModalProvider>
                    </AppStateProvider>
                  </NetworkProvider>
                </AuthProvider>
              </I18nextProvider>
            </QueryClientProvider>
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
