import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhotoResolver from '../screens/user/Post/PhotoResolver';
import Subscription from '../screens/user/Subscription';
import Info from '../screens/user/Info/Info';
import PostSummary from '../screens/user/Post/PostSummary';
import NotificationsList from '../screens/user/Notifications/NotificationsList';
import SelectFakeLocation from '../screens/user/SelectFakeLocation';
import Licenses from '@/src/app/screens/user/Info/Screens/LIcenses';
import BottomTabs from '@/src/app/components/shared/BottomTabs';
import { PasswordChangeScreen } from '@/src/app/screens/user/ChangePassword';

const RootStack = createNativeStackNavigator();

export function UserNav() {
  return (
    <RootStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}
    >
      {/* Tabs ako hlavná časť aplikácie */}
      <RootStack.Screen name="MainTabs" component={BottomTabs} />

      {/* Extra screens mimo tabs */}
      <RootStack.Screen name="PhotoResolver" component={PhotoResolver} />
      <RootStack.Screen name="Subscription" component={Subscription} />
      <RootStack.Screen name="PostSummary" component={PostSummary} />
      <RootStack.Screen
        name="NotificationsList"
        component={NotificationsList}
      />
      <RootStack.Screen
        name="SelectFakeLocation"
        component={SelectFakeLocation}
      />
      <RootStack.Screen name={'Info'} component={Info} />
      <RootStack.Screen
        name="PasswordChangeScreen"
        component={PasswordChangeScreen}
      />

      <RootStack.Screen name="Licenses" component={Licenses} />
    </RootStack.Navigator>
  );
}
