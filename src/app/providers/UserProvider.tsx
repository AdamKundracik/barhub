import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getCurrentUser, setUser } from '../utils/services/functions';
import { auth } from '../../../firebaseConfig';
import { GetUserResult } from '../utils/helper-functions/functions-types';
import { User } from '../../../shared';
import { getProfilePicture } from '../utils/helper-functions/helperFunctions';
import { LocationType } from '../utils/types/types';
import { getCoords } from '../utils/helper-functions/get-coords';

type ContextProps = {
  location: LocationType;
  setLocation: (value: LocationType) => void;
  userData: User | null;
  isLoading: boolean;
};

const initialContext: ContextProps = {
  userData: null,
  isLoading: true,
  location: { latitude: 0, longitude: 0 },
  setLocation: value => {},
};

interface Props {
  children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>(initialContext);

export const UserProvider = (props: Props) => {
  const [userData, setUserData] = useState<GetUserResult['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<LocationType>({
    latitude: 0,
    longitude: 0,
  });

  async function getLocation(): Promise<void> {
    try {
      const coords: LocationType = await getCoords();
      await setUser({
        location: { latitude: coords.latitude, longitude: coords.longitude },
      });
      setLocation(coords);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (auth.currentUser?.uid) {
      getLocation().catch(e => console.error(e));
      const interval = setInterval(() => {
        getLocation().catch(e => console.error(e));
      }, 150000);
      return () => clearInterval(interval);
    }
  }, []);

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
      isLoading,
      location,
      setLocation,
    };
  }, [userData, isLoading, location, setLocation]);

  return (
    <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
