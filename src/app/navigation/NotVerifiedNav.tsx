import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmailNotVerified from '../screens/user/EmailNotVerified';

const NotVerifiedStack = createNativeStackNavigator();

const NotVerifiedNav = () => {
  return (
    <NotVerifiedStack.Navigator
      initialRouteName={'EmailNotVerified'}
      screenOptions={{
        headerShown: false,
      }}
    >
      <NotVerifiedStack.Screen
        name={'EmailNotVerified'}
        component={EmailNotVerified}
      />
    </NotVerifiedStack.Navigator>
  );
};

export default NotVerifiedNav;
