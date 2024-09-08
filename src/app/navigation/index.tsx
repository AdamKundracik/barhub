import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { useUserContext } from '../providers/UserProvider';
import NotVerifiedNav from './NotVerifiedNav';
import { UserNav } from './UserNav';

export const Navigation = () => {
  const { authUser, isLoadingAuth, userData, emailVerified } = useUserContext();

  if (isLoadingAuth) {
    return <Loading />;
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
