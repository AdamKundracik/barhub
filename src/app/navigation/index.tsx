import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { UserProvider } from '../providers/UserProvider';
import { useAuthIdToken, useAuthUser } from '@react-query-firebase/auth';
import { auth } from '../../../firebaseConfig';
import UserNav from './UserNav';
import SetuProfileNav from './SetuProfileNav';

export const Navigation = () => {
  const tokenResult = useAuthIdToken(['token'], auth, {
    refetchOnWindowFocus: 'always',
  });
  const user = useAuthUser(['user'], auth, {
    onSuccess(user) {
      if (user) {
        // console.log('User is authenticated!', user.email, user.displayName);
      }
    },
    refetchOnReconnect: true,
    onError(error) {
      console.error('Failed to subscribe to users authentication state!');
    },
  });

  if (user.isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      <UserProvider>
        {user.data ? (
          user.data.displayName ? (
            <UserNav />
          ) : (
            <SetuProfileNav />
          )
        ) : (
          <AuthNav />
        )}
      </UserProvider>
    </NavigationContainer>
  );
};
