import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import {NavigationContainer} from "@react-navigation/native";
import Register from "./src/app/screens/auth/Register";
import LogIn from "./src/app/screens/auth/LogIn";
import {createNativeStackNavigator} from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();


export default function App() {

  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Login' screenOptions={{headerTintColor: 'black'}}>
            <Stack.Screen name='Login' component={LogIn} />
            <Stack.Screen
              name='Register'
              component={Register}
            />
        </Stack.Navigator>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
