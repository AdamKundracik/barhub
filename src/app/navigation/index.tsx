import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import NotVerifiedNav from './NotVerifiedNav';
import { UserNav } from './UserNav';
import { useAppState } from '../providers/AppStateProvider';
import { PermissionsScreen } from '../screens/user/Permissions/Permissions';
import { usePermissionsContext } from '../providers/PermissionsProvider';
import { useAppInitialization } from '@/src/app/utils/hooks/useInitializationApp';

export const Navigation = () => {
  const { authUser, emailVerified, isAppInitialized } = useAppInitialization();

  const { hasAllPermissions, checkAllPermissions } = usePermissionsContext();
  const { appState } = useAppState();

  useEffect(() => {
    switch (appState) {
      case 'active':
        checkAllPermissions();
        break;
    }
  }, [appState]);

  if (!isAppInitialized) {
    return <Loading />;
  }

  if (!hasAllPermissions) {
    return <PermissionsScreen />;
  }

  return (
    <NavigationContainer>
      {authUser ? (
        emailVerified ? (
          <UserNav />
        ) : (
          <NotVerifiedNav />
        )
      ) : (
        <AuthNav />
      )}
    </NavigationContainer>
  );
};
