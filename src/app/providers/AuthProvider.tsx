import { LocationType } from '../utils/types/types';
import { getCoords } from '../utils/helper-functions/get-coords';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { auth } from '../../../firebaseConfig';

type ContextProps = {
  emailVerified: boolean;
  location: LocationType;
  setLocation: (value: LocationType) => void;
};

const AuthContext = createContext<Partial<ContextProps>>({});

interface Props {
  children: ReactNode;
}

export const AuthProvider = (props: Props) => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [location, setLocation] = useState<LocationType>({
    latitude: 0,
    longitude: 0,
  });

  async function getLocation(): Promise<void> {
    try {
      const coords: LocationType = await getCoords();
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
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [auth.currentUser?.uid]);

  const ctx = useMemo(() => {
    return {
      emailVerified,
      location,
      setLocation,
    };
  }, [emailVerified, location, setLocation]);

  return (
    <AuthContext.Provider value={ctx}>{props.children}</AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
