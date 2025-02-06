import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { useUserContext } from '../providers/UserProvider';
import NotVerifiedNav from './NotVerifiedNav';
import { UserNav } from './UserNav';
import { PermissionsScreen } from '../screens/user/Permissions/Permissions';
import { usePermissionsProvider } from '../providers/PermissionsProvider';
import { useAppState } from '../providers/AppStateProvider';

export const Navigation = () => {
  const { authUser, isLoading, userData, emailVerified } = useUserContext();
  const { hasAllPermissions, checkPermissions } = usePermissionsProvider();
  const { appState } = useAppState();

  useEffect(() => {
    switch (appState) {
      case 'active':
        checkPermissions();
        break;
    }
  }, [appState]);

  if (isLoading || !userData) {
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
