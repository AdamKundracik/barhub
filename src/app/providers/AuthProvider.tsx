import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { AccountTypeEnum } from "../utils/types/types";
import { auth } from "../../../firebaseConfig";

type ContextProps = {
  authUser: null | boolean;
  accountType: null | AccountTypeEnum;
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
    onAuthStateChanged(auth, (u) => {
      setAuthUser(!!u);
      setIsLoadingAuth(false);
    });
  }, [auth.currentUser?.uid]);

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
