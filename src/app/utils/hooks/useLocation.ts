import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { useLocationStore } from '../store/locationStore';
import { LocationType } from '../types/types';
import { getCoords } from '../helper-functions/get-coords';
import { setUserIntoDB } from '../helper-functions/setUserLocationIntoDB';
import { useNewsFeedData } from './NewsFeed/usePostData';

export const useLocation = () => {
  const {
    useFakeLocation,
    realLocation,
    fakeLocation,
    setRealLocation,
    setUseFakeLocation,
    setFakeLocation,
  } = useLocationStore();

  const { refetch } = useNewsFeedData();

  const currentLocation =
    useFakeLocation && fakeLocation ? fakeLocation : realLocation;

  const updateLocationInDB = useCallback(async (location: LocationType) => {
    try {
      await setUserIntoDB(location);
    } catch (error) {
      console.error('Error updating location in DB:', error);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (useFakeLocation) return; // keď je fake, nerefreshujeme real
    try {
      const coords = await getCoords();
      setRealLocation(coords);
      await updateLocationInDB(coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, [useFakeLocation, setRealLocation, updateLocationInDB]);

  // inicializácia background geolocation listenerov
  useEffect(() => {
    const setupBackgroundLocation = async () => {
      const onLocation = BackgroundGeolocation.onLocation(async location => {
        const coords: LocationType = {
          latitude: location.coords?.latitude,
          longitude: location.coords?.longitude,
        };

        if (location.coords?.speed && location.coords?.speed <= 4) {
          setRealLocation(coords);
          await updateLocationInDB(coords);
        }
      });

      const onMotionChange = BackgroundGeolocation.onMotionChange(
        async event => {
          const { latitude, longitude } = event.location.coords;
          const coords: LocationType = { latitude, longitude };

          if (!event.isMoving) {
            setRealLocation(coords);
            await updateLocationInDB(coords);
          }
        }
      );

      await BackgroundGeolocation.ready({
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
    };

    setupBackgroundLocation();
  }, [setRealLocation, updateLocationInDB]);

  // spusti/stopni tracking podľa fake režimu
  useEffect(() => {
    if (!useFakeLocation) {
      BackgroundGeolocation.start();
      refetch();
    } else {
      BackgroundGeolocation.stop();
      // keď prepneme na fake → zapíšeme fake polohu do DB
      if (fakeLocation) {
        updateLocationInDB(fakeLocation);
        refetch();
      }
    }
  }, [useFakeLocation, fakeLocation, updateLocationInDB, refetch]);

  // pri návrate do appky vyžiadame čerstvú polohu (iba ak nie je fake)
  useEffect(() => {
    if (AppState.currentState === 'active') {
      getCurrentLocation();
    }
  }, [AppState.currentState]);

  return {
    currentLocation,
    useFakeLocation,
    fakeLocation,
    setUseFakeLocation,
    setFakeLocation,
    getCurrentLocation,
  };
};
