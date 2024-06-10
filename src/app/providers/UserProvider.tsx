import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {getCurrentUser} from "../utils/services/functions";
import {auth} from "../../../firebaseConfig";
import {GetUserResult} from "../utils/helper-functions/functions-types";
import {User} from "../../../shared";

type ContextProps = {
    userData: User | null,
    isLoading: boolean
};

const initialContext: ContextProps = {
    userData: null,
    isLoading: true
};

interface Props {
    children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>(initialContext);

export const UserProvider = (props: Props) => {
    const [userData, setUserData] = useState<GetUserResult['data'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const uid = auth.currentUser?.uid;
            if (uid) {
                const user = await getCurrentUser(uid);
                setUserData(user.data);
            }
            setIsLoading(false);
        };
        fetchUserData();
    }, []);

    const ctx = useMemo(() => {
        return {
            userData,
            isLoading
        };
    }, [userData, isLoading]);

    return (
        <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
