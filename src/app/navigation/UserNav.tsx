import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhotoResolver from '../screens/user/PhotoResolver';
import Subscription from '../screens/user/Subscription';
import { StyleSheet } from 'react-native';
import NewsFeed from '../screens/user/NewsFeed';
import PlaceSearch from '../screens/user/PlaceSearch';
import Account from '../screens/user/Account';
import PasswordChangeScreen from '../screens/user/ChangePassword';
import Help from '../screens/user/Help';
import Info from '../screens/user/Info/Info';

const UserStack = createNativeStackNavigator();

export function UserNav() {
  return (
    <UserStack.Navigator
      initialRouteName={'Feed'}
      screenOptions={{
        headerShown: false,
      }}
    >
      <UserStack.Screen
        name={'Feed'}
        component={NewsFeed}
        options={{ animation: 'slide_from_bottom' }}
      />
      <UserStack.Screen
        name={'Account'}
        component={Account}
        options={{ animation: 'fade_from_bottom' }}
      />
      <UserStack.Screen
        name={'PlaceSearch'}
        component={PlaceSearch}
        options={{ animation: 'fade_from_bottom', gestureEnabled: false }}
      />
      <UserStack.Screen name={'PhotoResolver'} component={PhotoResolver} />
      <UserStack.Screen
        name={'Subscription'}
        component={Subscription}
        options={{ animation: 'fade_from_bottom', gestureEnabled: false }}
      />
      <UserStack.Screen
        name={'PasswordChangeScreen'}
        component={PasswordChangeScreen}
        options={{ animation: 'fade_from_bottom', gestureEnabled: false }}
      />
      <UserStack.Screen
        name={'Help'}
        component={Help}
        options={{ animation: 'fade_from_bottom', gestureEnabled: false }}
      />
      <UserStack.Screen
        name={'Info'}
        component={Info}
        options={{ animation: 'fade_from_bottom', gestureEnabled: false }}
      />
    </UserStack.Navigator>
  );
}
