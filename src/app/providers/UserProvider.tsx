import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery, useMutation } from 'react-query';
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

type ContextProps = {
  authUser: null | boolean;
  isLoadingAuth: boolean;
  location: LocationType;
  setLocation: (value: LocationType) => void;
  userData: User | null;
  isLoading: boolean;
  emailVerified: boolean;
  users: User[] | undefined;
};

interface Props {
  children: ReactNode;
}

const UserContext = createContext<Partial<ContextProps>>({});

export const UserProvider = (props: Props) => {
  const [location, setLocation] = useState<LocationType>({
    latitude: 0,
    longitude: 0,
  });
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<null | boolean>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // React Query: Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useQuery(
    ['currentUser'],
    getCurrentUser,
    {
      enabled: !!auth.currentUser, // only fetch when user is authenticated
    }
  );

  // React Query: Fetch all existing users
  const { data: users } = useQuery(['allUsers'], getAllExistingUsers);

  // React Query: Update user location
  const mutation = useMutation(setUser);

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

      if (location.coords.speed && location.coords.speed <= 4) {
        setLocation(currentLocation);
        mutation.mutate({ location: currentLocation });
      }
    });

    const onActivityChange = BackgroundGeolocation.onActivityChange(event => {
      if (event.activity === 'in_vehicle') {
        BackgroundGeolocation.stop();
      } else {
        BackgroundGeolocation.start();
      }
    });

    const onMotionChange = BackgroundGeolocation.onMotionChange(async event => {
      const { latitude, longitude } = event.location.coords;
      const currentLocation: LocationType = { latitude, longitude };

      if (!event.isMoving) {
        setLocation(currentLocation);
        mutation.mutate({ location: currentLocation });
      }
    });

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 25,
      stopTimeout: 5,
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

  async function getLocation(): Promise<void> {
    try {
      const coords: LocationType = await getCoords();
      mutation.mutate({ location: coords });
      setLocation(coords);
    } catch (e) {
      console.error(e);
    }
  }

  const ctx = useMemo(() => {
    return {
      userData: userData || null,
      isLoading: isLoadingUser,
      location,
      setLocation,
      authUser,
      isLoadingAuth,
      emailVerified,
      users: users?.data?.users ?? [],
    };
  }, [
    userData,
    isLoadingUser,
    location,
    authUser,
    isLoadingAuth,
    emailVerified,
    users,
  ]);

  return (
    <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
