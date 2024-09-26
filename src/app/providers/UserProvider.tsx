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
import { useUserManagement } from '../utils/hooks/useUserManagement';
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
    ['userData', uid], // unique query key with dependency on uid
    async () => {
      const user = await getCurrentUser();
      return user;
    },
    {
      enabled: !!uid, // Only run query if uid exists
    }
  );
};

// Fetch all users function using React Query
const useFetchAllUsers = () => {
  return useQuery(
    'allUsers', // unique key for all users
    async () => {
      const allUsers = await getAllExistingUsers();
      return allUsers?.data?.users ?? [];
    }
  );
};

export const UserProvider = (props: Props) => {
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

  useEffect(() => {
    onAuthStateChanged(auth, u => {
      setAuthUser(!!u);
      setIsLoadingAuth(false);
      setEmailVerified(u?.emailVerified ?? false);
    });
  }, [auth]);

  useEffect(() => {
    const onLocation = BackgroundGeolocation.onLocation(async location => {
      const currentLocation: LocationType = {
        latitude: location.coords?.latitude,
        longitude: location.coords?.longitude,
      };

      // Set location to DB if speed is low (still) or after moving 50 meters
      if (location.coords.speed && location.coords.speed <= 4) {
        setLocation(currentLocation);
        await setUserIntoDB(currentLocation); // User is still, set location immediately
      }
    });

    const onActivityChange = BackgroundGeolocation.onActivityChange(event => {
      if (event.activity === 'in_vehicle') {
        BackgroundGeolocation.stop(); // Stops tracking if user is in vehicle
      } else {
        BackgroundGeolocation.start(); // Start tracking in other modes
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
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 25,
      stopTimeout: 3,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
      stopOnTerminate: false,
      startOnBoot: true,
      showsBackgroundLocationIndicator: true,
    }).then(state => {
      console.log(
        '- BackgroundGeolocation is configured and ready:',
        state.enabled
      );
    });

    return () => {
      onLocation.remove();
      onActivityChange.remove();
      onMotionChange.remove();
    };
  }, []);

  useEffect(() => {
    if (AppState.currentState === 'active') {
      getLocation();
    }
  }, [AppState.currentState]);

  useEffect(() => {
    BackgroundGeolocation.start();
    setLocation({ latitude: 0, longitude: 0 });
  }, []);

  useEffect(() => {
    refetchUserData(); // Refetch user data instead of direct call to fetchUserData
  }, [isLoadingAuth, auth]);

  const setUserIntoDB = async (location: LocationType) => {
    const hash = geohashForLocation([location.latitude, location.longitude]);
    await setUser({ location: location, geohash: hash });
  };

  async function getLocation(): Promise<void> {
    try {
      const coords: LocationType = await getCoords();
      await setUserIntoDB(coords);
      setLocation(coords);
    } catch (e) {
      console.error(e);
    }
  }

  const ctx = useMemo(() => {
    return {
      userData: userData ?? null,
      isLoading: isUserLoading || isUsersLoading,
      location,
      setLocation,
      authUser,
      isLoadingAuth,
      emailVerified,
      fetchAllUsers: async () => fetchAllUsers(),
      fetchUserData: async () => refetchUserData(),
      users,
    };
  }, [
    userData,
    isUserLoading,
    isUsersLoading,
    location,
    setLocation,
    authUser,
    isLoadingAuth,
    emailVerified,
    fetchAllUsers,
    refetchUserData,
    users,
  ]);

  return (
    <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
