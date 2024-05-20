import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import NewsFeed from "../screens/user/NewsFeed";


const UserStack = createNativeStackNavigator();

const UserNav = () => {
    return (
        <UserStack.Navigator initialRouteName='Feed' screenOptions={{headerTintColor: 'black'}}>
            <UserStack.Screen name='Feed' component={NewsFeed} />
            {/*<UserStack.Screen*/}
            {/*    name='Register'*/}
            {/*    component={Register}*/}
            {/*/>*/}
        </UserStack.Navigator>
    );
};

export default UserNav;
