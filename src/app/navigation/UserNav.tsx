import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhotoResolver from '../screens/user/Post/PhotoResolver';
import Subscription from '../screens/user/Subscription';
import NewsFeed from '../screens/user/NewsFeed';
import PlaceSearch from '../screens/user/PlaceSearch';
import Account from '../screens/user/Account';
import PasswordChangeScreen from '../screens/user/ChangePassword';
import Help from '../screens/user/Help/Help';
import Info from '../screens/user/Info/Info';
import PostSummary from '../screens/user/Post/PostSummary';
import NotificationsList from '../screens/user/Notifications/NotificationsList';
import { SelectFakeLocation } from '../screens/user/SelectFakeLocation';
import Licenses from '@/src/app/screens/user/Info/Screens/LIcenses';

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
        options={{ animation: 'fade_from_bottom' }}
      />
      <UserStack.Screen
        name={'PasswordChangeScreen'}
        component={PasswordChangeScreen}
      />
      <UserStack.Screen
        name={'Help'}
        component={Help}
        options={{ animation: 'fade_from_bottom' }}
      />
      <UserStack.Screen
        name={'Info'}
        component={Info}
        options={{ animation: 'fade_from_bottom' }}
      />
      <UserStack.Screen
        name={'PostSummary'}
        component={PostSummary}
        options={{ animation: 'fade_from_bottom' }}
      />
      <UserStack.Screen
        name={'NotificationsList'}
        component={NotificationsList}
      />
      <UserStack.Screen
        name={'SelectFakeLocation'}
        component={SelectFakeLocation}
      />
      <UserStack.Screen name={'Licenses'} component={Licenses} />
    </UserStack.Navigator>
  );
}
