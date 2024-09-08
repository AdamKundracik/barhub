import React from 'react';
import CameraScreen from '../screens/user/Camera';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhotoResolver from '../screens/user/PhotoResolver';
import Subscription from '../screens/user/Subscription';
import { StyleSheet } from 'react-native';
import { useUserContext } from '../providers/UserProvider';
import NewsFeed from '../screens/user/NewsFeed';
import PlaceSearch from '../screens/user/PlaceSearch';
import Account from '../screens/user/Account'; // Adjust this import to match your icon path

const UserStack = createNativeStackNavigator();

export function UserNav() {
  const { userData, fetchUserData } = useUserContext();

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
        options={{ animation: 'fade_from_bottom' }}
      />
      <UserStack.Screen
        name={'Camera'}
        component={CameraScreen}
        options={{ animation: 'slide_from_left' }}
      />
      <UserStack.Screen name={'PhotoResolver'} component={PhotoResolver} />
      <UserStack.Screen name={'Subscription'} component={Subscription} />
    </UserStack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'translucent',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 75,
  },
});
