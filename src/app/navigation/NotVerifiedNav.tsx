import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmailNotVerified from '../screens/user/EmailNotVerified';
import { VerifyEmail } from '../screens/auth/VerifyEmail';

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
      <NotVerifiedStack.Screen name={'VerifyEmail'} component={VerifyEmail} />
    </NotVerifiedStack.Navigator>
  );
};

export default NotVerifiedNav;
