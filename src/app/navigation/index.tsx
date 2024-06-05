import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthContext } from "../providers/AuthProvider";
import { Loading } from "../screens/Loading";
import UserNav from "./UserNav";
import AuthNav from "./AuthNav";
import { UserProvider, useUserContext } from "../providers/UserProvider";

const UserNavWrapper = () => {
    const { userData } = useUserContext();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userData !== null) {
            setIsLoading(false);
        }
    }, [userData]);

    if (isLoading) {
        return <Loading />;
    }

    return <UserNav />;
};

export const Navigation = () => {
    const { authUser, isLoadingAuth, emailVerified } = useAuthContext();

    if (isLoadingAuth) {
        return <Loading/>;
    }

    return (
        <NavigationContainer>
            {authUser ? 
                <UserProvider>
                    <UserNavWrapper />
                </UserProvider>
             : 
             <UserProvider>
                <AuthNav/>
            </UserProvider>}
        </NavigationContainer>
    );
};
