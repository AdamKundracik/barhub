import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Linking } from 'react-native';
import { Loading } from '../components/shared/Loading';
import AuthNav from './AuthNav';
import { UserNavWrapper } from './UserNavWrapper';
import { useAppState } from '../providers/AppStateProvider';
import { PermissionsScreen } from '../screens/user/Permissions/Permissions';
import { usePermissionsContext } from '../providers/PermissionsProvider';
import { useAppInitialization } from '@/src/app/utils/hooks/useInitializationApp';
import { useAuth } from '../providers/AuthProvider';
import { useNetwork } from '../providers/NetworkProvider';
import { NetworkTopBar } from '../components/shared/NetworkTopBar';
import { OfflineScreen } from '../screens/shared/OfflineScreen';

// Deep linking configuration
const linking = {
  prefixes: ['barhub://', 'https://barhub.app'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token: string) => `${token}`,
        },
        stringify: {
          token: (token: string) => token,
        },
      },
    },
  },
};

export const Navigation = () => {
  const { isAppInitialized } = useAppInitialization();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { hasAllPermissions, checkAllPermissions } = usePermissionsContext();
  const { appState } = useAppState();
  const { isConnected, isLoading: isNetworkLoading } = useNetwork();

  // Debug deep links
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      console.log('[Deep Link] Initial URL:', url);
    });
    
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[Deep Link] Received URL:', url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    switch (appState) {
      case 'active':
        checkAllPermissions();
        break;
    }
  }, [appState]);

  if (!isAppInitialized || isNetworkLoading || isAuthLoading) {
    return <Loading />;
  }

  if (!hasAllPermissions) {
    return <PermissionsScreen />;
  }

  // Show offline screen if user is authenticated but has no network connection
  if (isAuthenticated && !isConnected) {
    return (
      <>
        <NetworkTopBar />
        <OfflineScreen />
      </>
    );
  }

  return (
    <>
      <NetworkTopBar />
      <NavigationContainer linking={linking as any}>
        {isAuthenticated ? <UserNavWrapper /> : <AuthNav />}
      </NavigationContainer>
    </>
  );
};
