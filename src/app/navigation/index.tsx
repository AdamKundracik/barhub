import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { useUserContext } from '../providers/UserProvider';
import UserNav from './UserNav';

export const Navigation = () => {
  const { authUser, isLoadingAuth, userData } = useUserContext();

  if (isLoadingAuth) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      {authUser ? <UserNav /> : <AuthNav />}
    </NavigationContainer>
  );
};
