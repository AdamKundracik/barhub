import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getAllExistingUsers,
  getCurrentUser,
  setUser,
} from '../utils/services/functions';
import { auth } from '../../../firebaseConfig';
import { User } from '../../../shared';
import { LocationType } from '../utils/types/types';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { getCoords } from '../utils/helper-functions/get-coords';
import { AppState } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useQuery } from 'react-query';
import { geohashForLocation } from 'geofire-common';

type ContextProps = {
  authUser: null | boolean;
  isLoadingAuth: boolean;
  location: LocationType;
  setLocation: (value: LocationType) => void;
  userData: User | null;
  isLoading: boolean;
  emailVerified: boolean;
  fetchUserData: () => void;
  fetchAllUsers: () => void;
  users: User[] | undefined;
};

interface Props {
  children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>({});

const useFetchUserData = () => {
  const uid = auth.currentUser?.uid;

  return useQuery(
    'userData',
    async () => {
      const user = await getCurrentUser();
      return user;
    },
    {
      enabled: !!uid,
    }
  );
};

const useFetchAllUsers = () => {
  return useQuery('allUsers', async () => {
    const allUsers = await getAllExistingUsers();
    return allUsers?.data?.users ?? [];
  });
};

// Function to update user in DB
const setUserIntoDB = async (location: LocationType) => {
  const hash = geohashForLocation([location.latitude, location.longitude]);
  await setUser({ location: location, geohash: hash });
};

export const UserProvider = ({ children }: Props) => {
  const [location, setLocation] = useState<LocationType>({
    latitude: 0,
    longitude: 0,
  });
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<null | boolean>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Fetching user data and users with useQuery
  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUserData,
  } = useFetchUserData();
  const {
    data: users,
    isLoading: isUsersLoading,
    refetch: fetchAllUsers,
  } = useFetchAllUsers();

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setAuthUser(!!u);
      setIsLoadingAuth(false);
      setEmailVerified(u?.emailVerified ?? false);
    });
    return unsubscribe;
  }, []);

  // Fetch location when app state changes
  useEffect(() => {
    if (AppState.currentState === 'active') {
      getLocation();
    }
  }, [AppState.currentState]);

  const getLocation = async () => {
    try {
      const coords: LocationType = await getCoords();
      await setUserIntoDB(coords);
      setLocation(coords);
    } catch (e) {
      console.error(e);
    }
  };

  // Hook for BackgroundGeolocation setup
  useEffect(() => {
    const onLocation = BackgroundGeolocation.onLocation(async location => {
      const currentLocation: LocationType = {
        latitude: location.coords?.latitude,
        longitude: location.coords?.longitude,
      };
      if (location.coords?.speed && location.coords?.speed <= 4) {
        setLocation(currentLocation);
        await setUserIntoDB(currentLocation);
      }
    });

    const onMotionChange = BackgroundGeolocation.onMotionChange(async event => {
      const { latitude, longitude } = event.location.coords;
      const currentLocation: LocationType = { latitude, longitude };

      if (!event.isMoving) {
        setLocation(currentLocation);
        await setUserIntoDB(currentLocation);
      }
    });

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
      distanceFilter: 25,
      stopTimeout: 3,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
      stopOnTerminate: false,
      startOnBoot: true,
      showsBackgroundLocationIndicator: false,
    }).then(state => {
      BackgroundGeolocation.start();
      console.log('- BackgroundGeolocation configured:', state.enabled);
    });

    return () => {
      onLocation.remove();
      onMotionChange.remove();
    };
  }, []);

  const ctx = useMemo(
    () => ({
      userData: userData ?? null,
      isLoading: isUserLoading || isUsersLoading,
      location,
      setLocation,
      authUser,
      isLoadingAuth,
      emailVerified,
      fetchAllUsers: fetchAllUsers,
      fetchUserData: refetchUserData,
      users,
    }),
    [
      userData,
      isUserLoading,
      isUsersLoading,
      location,
      authUser,
      isLoadingAuth,
      emailVerified,
      fetchAllUsers,
      refetchUserData,
      users,
    ]
  );

  return <UserContext.Provider value={ctx}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
