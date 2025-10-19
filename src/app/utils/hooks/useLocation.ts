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
        if (!event.coords?.speed || event.coords?.speed <= 5) {
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
        distanceFilter: 20, // 20 meters - reasonable threshold
        stopTimeout: 10, // 10 seconds - send update when stationary, then stop
        debug: false,
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
        stopOnTerminate: false,
        startOnBoot: true,
        showsBackgroundLocationIndicator: false,
        // Optimized settings for reasonable DB writes
        stationaryRadius: 20, // 20 meters radius for stationary detection
        activityRecognitionInterval: 10000, // 10 seconds
        minimumActivityRecognitionConfidence: 75, // 75% confidence
        heartbeatInterval: 60, // 1 minute heartbeat
        // Additional settings for better control
        locationUpdateInterval: 30000, // 30 seconds between location updates
        fastestLocationUpdateInterval: 15000, // 15 seconds minimum
        locationTimeout: 60, // 60 seconds timeout
        deferTime: 0, // No defer time
        // Battery optimization
        pausesLocationUpdatesAutomatically: true, // Pause when stationary
        backgroundPermissionRationale: {
          title: "Allow {applicationName} to access to this device's location even when closed or not in use.",
          message: "This app collects location data to enable features like finding nearby places and sharing your location with friends.",
          positiveAction: 'Change to "Allow all the time"',
          negativeAction: 'Cancel'
        }
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
          // Don't refetch posts automatically on location change
          // refetch();
        } catch (err) {
          console.error('Failed to start BackgroundGeolocation:', err);
        }
      } else {
        try {
          await BackgroundGeolocation.stop();
          if (fakeLocation) setLocation(fakeLocation);
          // Refetch only when switching to fake location (manual action)
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

  // Disabled: Don't update location on app state change
  // This was causing posts to refetch every time user returns from background
  // Background geolocation will still update location when user moves
  /*
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
  */

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
