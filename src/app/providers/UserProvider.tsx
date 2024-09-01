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
import { User } from '../../../shared';
import { LocationType } from '../utils/types/types';
import { useUserManagement } from '../utils/hooks/useUserManagement';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { getCoords } from '../utils/helper-functions/get-coords';
import { AppState } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';

type ContextProps = {
  authUser: null | boolean;
  isLoadingAuth: boolean;
  location: LocationType;
  setLocation: (value: LocationType) => void;
  userData: User | null;
  isLoading: boolean;
};

interface Props {
  children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>({});

export const UserProvider = (props: Props) => {
  const [userData, setUserData] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<LocationType>({
    latitude: 0,
    longitude: 0,
  });
  const [initializing, setInitializing] = useState(true);
  const { setUserToStore } = useUserManagement();

  const [authUser, setAuthUser] = useState<null | boolean>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, u => {
      setAuthUser(!!u);
      setUserData(u);
      setIsLoadingAuth(false);
    });
  }, [auth]);

  useEffect(() => {
    if (AppState.currentState === 'active') {
      getLocation();
    }

    async function setUserIntoDB(location: LocationType) {
      await setUser({ location: location });
    }

    const onLocation = BackgroundGeolocation.onLocation(location => {
      const currentLocation: LocationType = {
        latitude: location.coords?.latitude,
        longitude: location.coords?.longitude,
      };
      setLocation(currentLocation);
      setUserIntoDB(currentLocation);
    });

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 100,
      stopTimeout: 5,
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,
      startOnBoot: true,
      showsBackgroundLocationIndicator: true,
    }).then(state => {
      console.log(
        '- BackgroundGeolocation is configured and ready: ',
        state.enabled
      );
    });

    return () => {
      onLocation.remove();
    };
  }, []);

  useEffect(() => {
    BackgroundGeolocation.start();
    setLocation({ latitude: 0, longitude: 0 });
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const user = await getCurrentUser();
        if (user.data) setUserToStore.mutateAsync(user.data);
        setUserData(user.data);
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, [isLoadingAuth]);

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

  const ctx = useMemo(() => {
    return {
      userData,
      isLoading,
      location,
      setLocation,
      authUser,
      isLoadingAuth,
    };
  }, [userData, isLoading, location, setLocation, authUser, isLoadingAuth]);

  return (
    <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
