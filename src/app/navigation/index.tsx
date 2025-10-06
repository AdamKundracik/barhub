import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../components/shared/Loading';
import AuthNav from './AuthNav';
import { UserNav } from './UserNav';
import { useAppState } from '../providers/AppStateProvider';
import { PermissionsScreen } from '../screens/user/Permissions/Permissions';
import { usePermissionsContext } from '../providers/PermissionsProvider';
import { useAppInitialization } from '@/src/app/utils/hooks/useInitializationApp';
import { useAuth } from '../providers/AuthProvider';
import { useNetwork } from '../providers/NetworkProvider';
import { NetworkTopBar } from '../components/shared/NetworkTopBar';
import { OfflineScreen } from '../screens/shared/OfflineScreen';

export const Navigation = () => {
  const { isAppInitialized } = useAppInitialization();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { hasAllPermissions, checkAllPermissions } = usePermissionsContext();
  const { appState } = useAppState();
  const { isConnected, isLoading: isNetworkLoading } = useNetwork();

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
      <NavigationContainer>
        {isAuthenticated ? <UserNav /> : <AuthNav />}
      </NavigationContainer>
    </>
  );
};
