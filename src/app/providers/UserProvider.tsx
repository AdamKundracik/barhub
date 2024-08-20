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
import { LocationType } from '../utils/types/types';
import { useUserManagement } from '../utils/hooks/useUserManagement';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { getCoords } from '../utils/helper-functions/get-coords';
import { AppState } from 'react-native';

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
  const { setUserToStore } = useUserManagement();

  useEffect(() => {
    if (AppState.currentState === 'active') {
      getLocation();
    }

    async function setUserIntoDB(location: LocationType) {
      await setUser({ location: location });
    }

    const onLocation = BackgroundGeolocation.onLocation(location => {
      console.log('[onLocation]', location);
      console.log('coords', JSON.stringify(location.coords));
      const currentLocation: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setLocation(currentLocation);
      setUserIntoDB(currentLocation);
    });

    const onMotionChange = BackgroundGeolocation.onMotionChange(event => {
      console.log('[onMotionChange]', event);
    });

    const onActivityChange = BackgroundGeolocation.onActivityChange(event => {
      console.log('[onActivityChange]', event);
    });

    const onProviderChange = BackgroundGeolocation.onProviderChange(event => {
      console.log('[onProviderChange]', event);
      switch (event.status) {
        case BackgroundGeolocation.AUTHORIZATION_STATUS_DENIED:
          console.log('- Location authorization denied');
          break;
        case BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS:
          console.log('- Location always granted');
          break;
        case BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE:
          console.log('- Location WhenInUse granted');
          break;
      }
    });

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      stopTimeout: 1,
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
      onMotionChange.remove();
      onActivityChange.remove();
      onProviderChange.remove();
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
  }, []);

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
    };
  }, [userData, isLoading, location, setLocation]);

  return (
    <UserContext.Provider value={ctx}>{props.children}</UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
