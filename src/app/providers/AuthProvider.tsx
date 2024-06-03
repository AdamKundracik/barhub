import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState,} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "../../../firebaseConfig";

type ContextProps = {
    authUser: null | boolean;
    emailVerified: boolean;
    isLoadingAuth: boolean;
};

const AuthContext = createContext<Partial<ContextProps>>({emailVerified: false, authUser: null, isLoadingAuth: false});

interface Props {
    children: ReactNode;
}

export const AuthProvider = (props: Props) => {
    const [authUser, setAuthUser] = useState<null | boolean>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);

    useEffect(() => {
        onAuthStateChanged(auth, (u) => {
            setAuthUser(!!u);
            setIsLoadingAuth(false);
        });
    }, [auth.currentUser?.uid]);

    const ctx = useMemo(() => {
        return {
            authUser,
            isLoadingAuth,
            emailVerified
        };
    }, [authUser, isLoadingAuth, emailVerified]);

    return (
        <AuthContext.Provider value={ctx}>{props.children}</AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
