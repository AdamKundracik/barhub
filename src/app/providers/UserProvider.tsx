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
  isLoading: boolean;
  location: LocationType;
  setLocation: (value: LocationType) => void;
  userData: User | null;
  emailVerified: boolean;
  fetchUserData: () => void;
  fetchAllUsers: () => void;
  users: User[] | undefined;
};

interface Props {
  children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>({});

const useFetchUserData = (uid: string | undefined) => {
  return useQuery(
    ['userData', uid],
    async () => {
      const user = await getCurrentUser();
      return user;
    },
    {
      enabled: !!uid,
      retry: 2,
      staleTime: 1000 * 60 * 5,
    }
  );
};

const useFetchAllUsers = () => {
  return useQuery('allUsers', async () => {
    const allUsers = await getAllExistingUsers();
    return allUsers?.data?.users ?? [];
  });
};

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
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUserData,
  } = useFetchUserData(auth.currentUser?.uid);

  const {
    data: users,
    isLoading: isUsersLoading,
    refetch: fetchAllUsers,
  } = useFetchAllUsers();

  const isLoading = isAuthLoading || isUserLoading || isUsersLoading;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setAuthUser(!!user);
      setEmailVerified(user?.emailVerified ?? false);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

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
      console.error('Error getting location:', e);
    }
  };

  useEffect(() => {
    const setupBackgroundGeolocation = async () => {
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

      const onMotionChange = BackgroundGeolocation.onMotionChange(
        async event => {
          const { latitude, longitude } = event.location.coords;
          const currentLocation: LocationType = { latitude, longitude };

          if (!event.isMoving) {
            setLocation(currentLocation);
            await setUserIntoDB(currentLocation);
          }
        }
      );

      await BackgroundGeolocation.ready({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
        distanceFilter: 25,
        stopTimeout: 3,
        debug: false,
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
        stopOnTerminate: false,
        startOnBoot: true,
        showsBackgroundLocationIndicator: false,
      });

      BackgroundGeolocation.start();

      return () => {
        onLocation.remove();
        onMotionChange.remove();
      };
    };

    setupBackgroundGeolocation();
  }, []);

  const contextValue = useMemo(
    () => ({
      userData: userData ?? null,
      isLoading,
      location,
      setLocation,
      authUser,
      emailVerified,
      fetchAllUsers,
      fetchUserData: refetchUserData,
      users,
    }),
    [
      userData,
      isLoading,
      location,
      authUser,
      emailVerified,
      fetchAllUsers,
      refetchUserData,
      users,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
