import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {UserRecord} from "../utils/types/types";
import {getCurrentUser} from "../utils/services/functions";
import {auth} from "../../../firebaseConfig";
import {GetUserResult} from "../utils/helper-functions/functions-types";

type ContextProps = {
    userData: UserRecord | null
};

const initialContext: ContextProps = {
    userData: null
};

interface Props {
    children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>(initialContext);


export const UserProvider = (props: Props) => {
    const [userData, setUserData] = useState<GetUserResult['data'] | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const uid = auth.currentUser?.uid;
            if (uid) {
                const user = await getCurrentUser(uid)
                setUserData(user.data)
            }
        };
        fetchUserData();
    }, []);

    const ctx = useMemo(() => {
        return {
            userData
        };
    }, [userData]);

    return (
        <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
