import React, {useState} from "react";
import NewsFeed from "../screens/user/NewsFeed";
import Account from "../screens/user/Account";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import CameraScreen from "../screens/user/Camera";
import SetUpProfile from "../screens/user/SetUpProfile";
import {useAuthUser} from "@react-query-firebase/auth";
import {auth} from "../../../firebaseConfig";

const UserStack = createNativeStackNavigator();

const UserNav = () => {
    const [loading, setLoading] = useState<boolean | undefined>(false)

    const user = useAuthUser(["user"], auth, {
            onSuccess(user) {
                if (user) {
                    console.log("User is authenticated!", user);
                }
            },

            onError(error) {
                console.error("Failed to subscribe to users authentication state!");
            }
        }
    );

    return (
        <>
            {user.data?.displayName ?
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
