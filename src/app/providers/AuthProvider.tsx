import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState,} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "../../../firebaseConfig";
import {LocationType} from "../utils/types/types";
import {getCoords} from "../utils/helper-functions/get-coords";

type ContextProps = {
    authUser: null | boolean;
    emailVerified: boolean;
    isLoadingAuth: boolean;
    location: LocationType,
    setLocation: (value: LocationType) => void;
};

const AuthContext = createContext<Partial<ContextProps>>({});

interface Props {
    children: ReactNode;
}

export const AuthProvider = (props: Props) => {
    const [authUser, setAuthUser] = useState<null | boolean>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);
    const [location, setLocation] = useState<LocationType>({latitude: 0, longitude: 0})

    async function getLocation(): Promise<void> {
        try {
            const coords: LocationType = await getCoords();
            setLocation(coords)
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        onAuthStateChanged(auth, (u) => {
            setAuthUser(!!u);
            setIsLoadingAuth(false);
        });
    }, [auth.currentUser?.uid]);

    useEffect(() => {
        if (auth.currentUser?.uid) {
            getLocation().catch((e) => console.error(e));
            const interval = setInterval(() => {
                getLocation().catch((e) => console.error(e));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [auth.currentUser?.uid]);

    const ctx = useMemo(() => {
        return {
            authUser,
            isLoadingAuth,
            emailVerified,
            location,
            setLocation,
        };
    }, [authUser, isLoadingAuth, emailVerified, location, setLocation]);

    return (
        <AuthContext.Provider value={ctx}>{props.children}</AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
