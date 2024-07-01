import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../screens/Loading';
import AuthNav from './AuthNav';
import { UserProvider } from '../providers/UserProvider';
import { useAuthUser } from '@react-query-firebase/auth';
import { auth } from '../../../firebaseConfig';
import UserNav from './UserNav';
import SetuProfileNav from './SetuProfileNav';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export const Navigation = () => {
  const user = useAuthUser(['user'], auth, {
    onSuccess(user) {
      if (user) {
        console.log('User is authenticated!', user.email, user.displayName);
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
    <NavigationContainer
      linking={{
        prefixes: [''],
        config: {
          screens: {
            Camera: 'Camera',
          },
        },
        async getInitialURL() {
          // Check if app was opened from a deep link
          const url = await Linking.getInitialURL();

          if (url != null) {
            return url;
          }

          // Handle URL from expo push notifications
          const response =
            await Notifications.getLastNotificationResponseAsync();

          console.log(
            'url',
            response?.notification.request.content.data.request
          );
          return response?.notification.request.content.data.url;
        },
        subscribe(listener) {
          const onReceiveURL = ({ url }: { url: string }) => listener(url);

          // Listen to incoming links from deep linking
          const eventListenerSubscription = Linking.addEventListener(
            'url',
            onReceiveURL
          );

          // Listen to expo push notifications
          const subscription =
            Notifications.addNotificationResponseReceivedListener(response => {
              const url = response.notification.request.content.data.url;

              // Any custom logic to see whether the URL needs to be handled
              //...

              // Let React Navigation handle the URL
              listener(url);
            });

          return () => {
            // Clean up the event listeners
            eventListenerSubscription.remove();
            subscription.remove();
          };
        },
      }}
    >
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
