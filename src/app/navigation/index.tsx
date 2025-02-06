import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { useUserContext } from '../providers/UserProvider';
import NotVerifiedNav from './NotVerifiedNav';
import { UserNav } from './UserNav';
import { usePermissions } from '../utils/hooks/usePermissions';
import { PermissionsScreen } from '../screens/user/Permissions/Permissions';
export const Navigation = () => {
  const { authUser, isLoading, userData, emailVerified } = useUserContext();

  const { permissions, isLoadingPermissions, hasAllPermissions } =
    usePermissions();

  // Add logging to track state changes
  useEffect(() => {
    console.log('Navigation state:', {
      isLoading,
      isLoadingPermissions,
      permissions,
      hasAllPermissions,
    });
  }, [isLoading, isLoadingPermissions, permissions, hasAllPermissions]);

  if (isLoading || isLoadingPermissions || !userData) {
    return <Loading />;
  }

  // Use the memoized value directly
  if (!hasAllPermissions) {
    console.log('Showing PermissionsScreen because hasAllPermissions is false');
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
