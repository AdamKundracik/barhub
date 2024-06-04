import React from "react";

import {NavigationContainer} from "@react-navigation/native";
import {useAuthContext} from "../providers/AuthProvider";
import {Loading} from "../screens/Loading";
import UserNav from "./UserNav";
import AuthNav from "./AuthNav";
import {UserProvider} from "../providers/UserProvider";

export const Navigation = () => {
    const {authUser, isLoadingAuth, emailVerified} = useAuthContext();

    if (isLoadingAuth) {
        return <Loading/>;
    }

    return (
        <NavigationContainer>
            {authUser ?
                <UserProvider>
                    <UserNav/>
                </UserProvider>
                :
                <AuthNav/>}
        </NavigationContainer>
    );
};
