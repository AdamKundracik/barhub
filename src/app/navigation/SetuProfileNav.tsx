import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SetUpProfile from '../screens/user/SetUpProfile';

const SetuProfileStack = createNativeStackNavigator();

const SetuProfileNav = () => {
  return (
    <SetuProfileStack.Navigator
      initialRouteName="SetupProfile"
      screenOptions={{ headerShown: false }}
    >
      <SetuProfileStack.Screen name="SetupProfile" component={SetUpProfile} />
    </SetuProfileStack.Navigator>
  );
};

export default SetuProfileNav;
