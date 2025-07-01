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
} from '../utils/services/functions';
import { auth } from '../../../firebaseConfig';
import { User } from '../../../shared';
import { LocationType } from '../utils/types/types';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { getCoords } from '../utils/helper-functions/get-coords';
import { AppState } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useQuery } from 'react-query';
import { setUserIntoDB } from '../utils/helper-functions/setUserLocationIntoDB';
import { useLocationStore } from '../utils/store/locationStore';

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

  useFakeLocation: boolean;
  setUseFakeLocation: (val: boolean) => void;

  fakeLocation: LocationType | null;
  // FIXED: setFakeLocation must accept 2 arguments as per store
  setFakeLocation: (loc: LocationType, name: string) => void;
};

interface Props {
  children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>({});

const useFetchUserData = (uid: string | undefined) => {
  return useQuery(
    ['userData', uid],
    async () => {
      return await getCurrentUser();
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

export const UserProvider = ({ children }: Props) => {
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<null | boolean>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Zustand store selectors
  const useFakeLocation = useLocationStore(state => state.useFakeLocation);
  const realLocation = useLocationStore(state => state.realLocation);
  const fakeLocation = useLocationStore(state => state.fakeLocation);
  const setFakeLocation = useLocationStore(state => state.setFakeLocation);
  const location = useLocationStore(state => state.realLocation);
  const setLocation = useLocationStore(state => state.setRealLocation);

  // Compute which location to use (fake or real)
  const currentLocation =
    useFakeLocation && fakeLocation ? fakeLocation : location;

  useEffect(() => {
    if (!useFakeLocation) {
      setUserIntoDB(realLocation).catch(console.error);
    } else {
      setUserIntoDB(fakeLocation!).catch(console.error);
    }
  }, [useFakeLocation, realLocation, fakeLocation]);

  // React Query hooks
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

  // Listen to auth state changes
  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setAuthUser(!!user);
      setEmailVerified(user?.emailVerified ?? false);
      setIsAuthLoading(false);
    });
  }, []);

  // Fetch location on app active
  useEffect(() => {
    if (AppState.currentState === 'active') {
      getLocation();
    }
    getLocation();
  }, [AppState.currentState]);

  const getLocation = async () => {
    if (useFakeLocation) return;
    try {
      const coords: LocationType = await getCoords();
      setLocation(coords);
      await setUserIntoDB(coords);
    } catch (e) {
      console.error('Error getting location:', e);
    }
  };

  // Setup background location tracking
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
      disableLocationAuthorizationAlert: true,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
      distanceFilter: 25,
      stopTimeout: 3,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
      stopOnTerminate: false,
      startOnBoot: true,
      showsBackgroundLocationIndicator: false,
    });

    return () => {
      onLocation.remove();
      onMotionChange.remove();
    };
  }, []);

  useEffect(() => {
    if (!useFakeLocation) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
    }
  }, [useFakeLocation]);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      userData: userData ?? null,
      isLoading,
      location: currentLocation,
      setLocation,
      authUser,
      emailVerified,
      fetchAllUsers,
      fetchUserData: refetchUserData,
      users,
      useFakeLocation,
      fakeLocation,
      setFakeLocation,
    }),
    [
      userData,
      isLoading,
      currentLocation,
      authUser,
      emailVerified,
      fetchAllUsers,
      refetchUserData,
      users,
      useFakeLocation,
      fakeLocation,
      setFakeLocation,
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
  return context as ContextProps;
};
