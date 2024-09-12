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
  emailVerified: boolean;
  fetchUserData: () => Promise<void>;
  users: User[] | undefined;
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

  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<null | boolean>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    onAuthStateChanged(auth, u => {
      setAuthUser(!!u);
      setUserData(u);
      setIsLoadingAuth(false);
      setEmailVerified(u?.emailVerified ?? false);
    });
  }, [auth]);

  useEffect(() => {
    const setUserIntoDB = async (location: LocationType) => {
      await setUser({ location });
    };

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
        // User has stopped moving, update location immediately
        setLocation(currentLocation);
        await setUserIntoDB(currentLocation);
      }
    });

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 50, // Update location every 50 meters when moving
      stopTimeout: 5, // Time (minutes) to stop after user becomes stationary
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
    fetchUserData();
  }, [isLoadingAuth, auth]);

  const fetchUserData = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const user = await getCurrentUser();
      setUserData(user.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    async function getUsers() {
      const allUsers = await getAllExistingUsers();
      setUsers(allUsers.data?.users ?? []);
    }
    getUsers();
  }, [auth.currentUser?.uid]);

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
      emailVerified,
      fetchUserData,
      users,
    };
  }, [
    userData,
    isLoading,
    location,
    setLocation,
    authUser,
    isLoadingAuth,
    emailVerified,
    fetchUserData,
    users,
  ]);

  return (
    <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
