import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LogIn from "../screens/auth/LogIn";
import Register from "../screens/auth/Register";
import ForgotPassword from "../screens/auth/ForgotPassword";


const AuthStack = createNativeStackNavigator();

const AuthNav = () => {
    return (
        <AuthStack.Navigator initialRouteName='Login' screenOptions={{headerShown: false}}>
            <AuthStack.Screen name='Login' component={LogIn} />
            <AuthStack.Screen
                name='Register'
                component={Register}
            />
            <AuthStack.Screen
                name='ForgotPassword'
                component={ForgotPassword}
            />
        </AuthStack.Navigator>
    );
};

export default AuthNav;
