import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { useLocationStore } from '../store/locationStore';
import { LocationType } from '../types/types';
import { getCoords } from '../helper-functions/get-coords';
import { useNewsFeedData } from './NewsFeed/usePostData';

export const useLocation = () => {
  const {
    useFakeLocation,
    location,
    setLocation,
    initialized,
    fakeLocation,
    setFakeLocation,
  } = useLocationStore();
  const { refetch } = useNewsFeedData();

  const getCurrentLocation = useCallback(async () => {
    if (useFakeLocation) return;

    try {
      const coords = await getCoords();
      // Only update if location actually changed
      if (
        !location ||
        location.latitude !== coords.latitude ||
        location.longitude !== coords.longitude
      ) {
        setLocation(coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, [useFakeLocation, location, setLocation]);

  // Background tracking setup
  useEffect(() => {
    const setupBackgroundLocation = async () => {
      const onLocation = BackgroundGeolocation.onLocation(event => {
        const currentLocation: LocationType = {
          latitude: event.coords.latitude,
          longitude: event.coords.longitude,
        };

        if (!event.coords.speed || event.coords.speed <= 4) {
          if (
            !location ||
            location.latitude !== currentLocation.latitude ||
            location.longitude !== currentLocation.longitude
          ) {
            setLocation(currentLocation);
          }
        }
      });

      const onMotionChange = BackgroundGeolocation.onMotionChange(event => {
        const currentLocation: LocationType = {
          latitude: event.location.coords.latitude,
          longitude: event.location.coords.longitude,
        };

        if (!event.isMoving) {
          if (
            !location ||
            location.latitude !== currentLocation.latitude ||
            location.longitude !== currentLocation.longitude
          ) {
            setLocation(currentLocation);
          }
        }
      });

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
  }, [setLocation]);

  // Start/stop tracking based on fake mode
  useEffect(() => {
    if (!initialized) return;
    console.log('Start/Stop effect, useFakeLocation:', useFakeLocation);
    if (!useFakeLocation) {
      BackgroundGeolocation.start()
        .then(() => console.log('BackgroundGeolocation started'))
        .catch(error =>
          console.error('Failed to start BackgroundGeolocation:', error)
        );
      refetch();
    } else {
      BackgroundGeolocation.stop()
        .then(() => console.log('BackgroundGeolocation stopped'))
        .catch(error =>
          console.error('Failed to stop BackgroundGeolocation:', error)
        );
      if (location) {
        refetch();
      }
    }
  }, [useFakeLocation, location, refetch, initialized]);

  // Fetch location when app becomes active
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        getCurrentLocation();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, []);

  return {
    useFakeLocation,
    getCurrentLocation,
  };
};
