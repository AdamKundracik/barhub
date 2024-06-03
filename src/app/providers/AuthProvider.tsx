import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState,} from "react";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {auth} from "../../../firebaseConfig";
import {Alert} from "react-native";

type ContextProps = {
    authUser: null | boolean;
    accountType: null;
    isLoadingAuth: boolean;
};

const AuthContext = createContext<Partial<ContextProps>>({});

interface Props {
    children: ReactNode;
}

export const AuthProvider = (props: Props) => {
    const [authUser, setAuthUser] = useState<null | boolean>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    useEffect(() => {
        const auth = getAuth()

        onAuthStateChanged(auth, (u) => {
            if (auth.currentUser?.emailVerified) {
                setAuthUser(!!u);
                setIsLoadingAuth(false);
            } else {
                Alert.alert("Email verification", "Please verify your email before log in");
                setAuthUser(null);
                setIsLoadingAuth(false);
            }
        });
    }, [auth.currentUser?.uid, auth.currentUser?.emailVerified]);

    const ctx = useMemo(() => {
        return {
            authUser,
            isLoadingAuth,
        };
    }, [authUser, isLoadingAuth]);

    return (
        <AuthContext.Provider value={ctx}>{props.children}</AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
