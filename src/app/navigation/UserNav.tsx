import React from "react";
import NewsFeed from "../screens/user/NewsFeed";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import Account from "../screens/user/Account";

const Tab = createBottomTabNavigator();

const UserNav = () => {
    return (

        <Tab.Navigator
            initialRouteName="Feed"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name={'Feed'} component={NewsFeed}/>
            {/*<Tab.Screen name={'Camera'}/>*/}
            <Tab.Screen name={'Account'} component={Account}/>
        </Tab.Navigator>
    );
};

export default UserNav;
