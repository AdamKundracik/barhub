import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getCurrentUser } from '../utils/services/functions';
import { auth } from '../../../firebaseConfig';
import { GetUserResult } from '../utils/helper-functions/functions-types';
import { User } from '../../../shared';
import { getProfilePicture } from '../utils/helper-functions/helperFunctions';

type ContextProps = {
  userData: User | null;
  profileUri: string;
  isLoading: boolean;
};

const initialContext: ContextProps = {
  profileUri: '',
  userData: null,
  isLoading: true,
};

interface Props {
  children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>(initialContext);

export const UserProvider = (props: Props) => {
  const [userData, setUserData] = useState<GetUserResult['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileUri, setProfileUri] = useState<string>('');

  useEffect(() => {
    async function getImage() {
      const uri = await getProfilePicture();
      if (uri) setProfileUri(uri);
    }

    getImage();
  }, [auth.currentUser?.uid]);

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
      profileUri,
      userData,
      isLoading,
    };
  }, [profileUri, userData, isLoading]);

  return (
    <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
