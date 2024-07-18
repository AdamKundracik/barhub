import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { UserProvider } from '../providers/UserProvider';
import { useAuthUser } from '@react-query-firebase/auth';
import { auth } from '../../../firebaseConfig';
import UserNav from './UserNav';
import SetuProfileNav from './SetuProfileNav';

export const Navigation = () => {
  const user = useAuthUser(['user'], auth, {
    onSuccess(user) {
      console.log(user);
    },
    onError(error) {
      console.error('Failed to subscribe to users authentication state!');
    },
  });

  console.log(user.isRefetching);

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
