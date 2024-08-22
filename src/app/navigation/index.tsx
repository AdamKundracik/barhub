import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { useUserContext } from '../providers/UserProvider';
import UserNav from './UserNav';
import { useQueryClient } from 'react-query';
import { User } from '../../../shared';

export const Navigation = () => {
  const queryClient = useQueryClient();

  const { authUser, isLoadingAuth, userData } = useUserContext();

  const user = queryClient.getQueryData<User>('user');

  console.log(user);

  if (isLoadingAuth) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      {authUser ? <UserNav /> : <AuthNav />}
    </NavigationContainer>
  );
};
