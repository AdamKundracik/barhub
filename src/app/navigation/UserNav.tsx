import React, {useEffect, useState} from "react";
import NewsFeed from "../screens/user/NewsFeed";
import Account from "../screens/user/Account";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import CameraScreen from "../screens/user/Camera";
import {useUserContext} from "../providers/UserProvider";
import SetUpProfile from "../screens/user/SetUpProfile";
import {User} from "../utils/types/types";

const UserStack = createNativeStackNavigator();

const UserNav = () => {
    const {userData} = useUserContext()
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<User | undefined | null>(null)

    useEffect(() => {
        setUser(userData)
    }, [userData]);

    console.log('user', userData, user)
    return (
        <>
            {user?.displayName && user.photoURL ?
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
