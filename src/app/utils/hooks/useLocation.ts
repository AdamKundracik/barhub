import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { useLocationStore } from '../store/locationStore';
import { LocationType } from '../types/types';
import { setUserIntoDB } from '../helper-functions/setUserLocationIntoDB';
import { getCoords } from '../helper-functions/get-coords';
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
    if (useFakeLocation) return;

    try {
      const coords = await getCoords();
      setRealLocation(coords);
      await updateLocationInDB(coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, [useFakeLocation, setRealLocation, updateLocationInDB]);

  useEffect(() => {
    const setupBackgroundLocation = async () => {
      const onLocation = BackgroundGeolocation.onLocation(async location => {
        const currentLocation: LocationType = {
          latitude: location.coords?.latitude,
          longitude: location.coords?.longitude,
        };

        if (location.coords?.speed && location.coords?.speed <= 4) {
          setRealLocation(currentLocation);
          await updateLocationInDB(currentLocation);
        }
      });

      const onMotionChange = BackgroundGeolocation.onMotionChange(
        async event => {
          const { latitude, longitude } = event.location.coords;
          const currentLocation: LocationType = { latitude, longitude };

          if (!event.isMoving) {
            setRealLocation(currentLocation);
            await updateLocationInDB(currentLocation);
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

  useEffect(() => {
    if (!useFakeLocation) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
    }
  }, [useFakeLocation]);

  useEffect(() => {
    if (AppState.currentState === 'active') {
      getCurrentLocation();
    }
  }, [getCurrentLocation]);

  useEffect(() => {
    const locationToUpdate = useFakeLocation ? fakeLocation : realLocation;
    if (locationToUpdate) {
      updateLocationInDB(locationToUpdate);
      refetch();
    }
  }, [useFakeLocation, realLocation, fakeLocation, updateLocationInDB]);

  return {
    currentLocation,
    useFakeLocation,
    fakeLocation,
    setUseFakeLocation,
    setFakeLocation,
    getCurrentLocation,
  };
};
