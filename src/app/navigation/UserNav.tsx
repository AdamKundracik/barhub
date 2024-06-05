import React, { useEffect, useState } from "react";
import NewsFeed from "../screens/user/NewsFeed";
import Account from "../screens/user/Account";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import CameraScreen from "../screens/user/Camera";
import {useUserContext} from "../providers/UserProvider";
import SetUpProfile from "../screens/user/SetUpProfile";

const UserStack = createNativeStackNavigator();

const UserNav = () => {
    const {userData, isLoading} = useUserContext();
    const [loading, setLoading] = useState<boolean | undefined>(false)

    useEffect(() => {
        setLoading(isLoading)
    },[isLoading])

    if (loading) {
        return ''
    }

    return (
        <>
            {userData ?
                <UserStack.Navigator
                    initialRouteName={'Feed'}
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <UserStack.Screen name={'Feed'} component={NewsFeed}/>
                    <UserStack.Screen name={'Account'} component={Account}/>
                    <UserStack.Screen name={'Camera'} component={CameraScreen}/>
                    <UserStack.Screen name={'SetUpProfile'} component={SetUpProfile}/>
                </UserStack.Navigator>
                :
                <UserStack.Navigator
                    initialRouteName={'SetUpProfile'}
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <UserStack.Screen name={'SetUpProfile'} component={SetUpProfile}/>
                    <UserStack.Screen name={'Feed'} component={NewsFeed}/>
                    <UserStack.Screen name={'Account'} component={Account}/>
                    <UserStack.Screen name={'Camera'} component={CameraScreen}/>
                </UserStack.Navigator>
            }
        </>

    );
};

export default UserNav;
