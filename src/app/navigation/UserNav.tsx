import React from "react";
import NewsFeed from "../screens/user/NewsFeed";
import Account from "../screens/user/Account";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import CameraScreen from "../screens/user/Camera";
import {useUserContext} from "../providers/UserProvider";
import SetUpProfile from "../screens/user/SetUpProfile";

const UserStack = createNativeStackNavigator();

const UserNav = () => {
    const {userData} = useUserContext()
    return (
        <UserStack.Navigator
            initialRouteName={userData?.displayName && userData.photoURL ? 'Feed' : 'Feed'}
            screenOptions={{
                headerShown: false,
            }}
        >
            <UserStack.Screen name={'Feed'} component={NewsFeed}/>
            <UserStack.Screen name={'Account'} component={Account}/>
            <UserStack.Screen name={'Camera'} component={CameraScreen}/>
            <UserStack.Screen name={'SetUpProfile'} component={SetUpProfile}/>


        </UserStack.Navigator>
    );
};

export default UserNav;
