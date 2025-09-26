import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { useLocationStore } from '../store/locationStore';
import { LocationType } from '../types/types';
import { getCoords } from '../helper-functions/get-coords';
import { useNewsFeedData } from './NewsFeed/usePostData';

export const useLocation = () => {
  const { useFakeLocation, location, setLocation, initialized, fakeLocation } =
    useLocationStore();
  const { refetch } = useNewsFeedData();

  // Ref na udržanie aktuálnej location, aby sme nemali location v deps
  const locationRef = useRef<LocationType | null>(location);
  locationRef.current = location;

  const getCurrentLocation = useCallback(async () => {
    try {
      if (useFakeLocation && fakeLocation) {
        setLocation(fakeLocation);
        return;
      }

      const coords = await getCoords();

      const current = locationRef.current;
      if (
        !current ||
        current.latitude !== coords.latitude ||
        current.longitude !== coords.longitude
      ) {
        setLocation(coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, [useFakeLocation, fakeLocation, setLocation]);

  useEffect(() => {
    const setupBackgroundLocation = async () => {
      const onLocation = BackgroundGeolocation.onLocation(event => {
        const currentLocation: LocationType = {
          latitude: event.coords?.latitude,
          longitude: event.coords?.longitude,
        };

        const current = locationRef.current;
        if (!event.coords.speed || event.coords.speed <= 4) {
          if (
            !current ||
            current.latitude !== currentLocation.latitude ||
            current.longitude !== currentLocation.longitude
          ) {
            setLocation(currentLocation);
          }
        }
      });

      const onMotionChange = BackgroundGeolocation.onMotionChange(event => {
        const currentLocation: LocationType = {
          latitude: event.location.coords?.latitude,
          longitude: event.location.coords?.longitude,
        };

        const current = locationRef.current;
        if (!event.isMoving) {
          if (
            !current ||
            current.latitude !== currentLocation.latitude ||
            current.longitude !== currentLocation.longitude
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
  }, [setLocation]); // ❌ bez location v deps

  useEffect(() => {
    if (!initialized) return;

    const startStopTracking = async () => {
      if (!useFakeLocation) {
        try {
          await BackgroundGeolocation.start();
          await getCurrentLocation();
          refetch();
        } catch (err) {
          console.error('Failed to start BackgroundGeolocation:', err);
        }
      } else {
        try {
          await BackgroundGeolocation.stop();
          if (fakeLocation) setLocation(fakeLocation);
          refetch();
        } catch (err) {
          console.error('Failed to stop BackgroundGeolocation:', err);
        }
      }
    };

    startStopTracking();
  }, [
    useFakeLocation,
    initialized,
    fakeLocation,
    refetch,
    getCurrentLocation,
    setLocation,
  ]);

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
  }, [getCurrentLocation]);

  // Initial fetch on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    useFakeLocation,
    getCurrentLocation,
    location,
  };
};
