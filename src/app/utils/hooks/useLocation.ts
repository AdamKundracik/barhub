import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { useLocationStore } from '../store/locationStore';
import { tokenManager } from '@/src/app/utils/api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '@/src/app/config/api';
import { useUserStore } from '@/src/app/utils/store/userStore';

export const useLocation = () => {
  const {
    useFakeLocation,
    location,
    setLocation,
    initialized,
    fakeLocation,
    isLocationLoading,
    setIsLocationLoading,
  } = useLocationStore();
  const userId = useUserStore(state => state.userData?.id?.toString());

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isFetchingPositionRef = useRef(false);

  // 1. Setup plugin - runs ONCE when userId is ready
  useEffect(() => {
    if (!userId || !initialized) return;

    let subs: Array<{ remove: () => void }> = [];

    const setup = async () => {
      const token = await tokenManager.getAccessToken();
      const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`;

      // Location listener - only save location for explicit requests (getCurrentPosition)
      // Background location updates are ignored - we only care when user stops
      subs.push(
        BackgroundGeolocation.onLocation(event => {
          if (!event.coords) return;

          // Skip intermediate samples - wait for final accurate location
          if (event.sample) {
            console.log(
              '[useLocation] Skipping sample location, waiting for final...'
            );
            return;
          }

          // Only save location if we explicitly requested it (getCurrentPosition)
          // This handles: foreground refresh, toggle fake location
          if (isFetchingPositionRef.current) {
            console.log('[useLocation] Explicit request - saving location:', {
              latitude: event.coords.latitude,
              longitude: event.coords.longitude,
              accuracy: event.coords.accuracy,
            });

            setLocation({
              latitude: event.coords.latitude,
              longitude: event.coords.longitude,
            });

            isFetchingPositionRef.current = false;
            setIsLocationLoading(false);
          }
          // Background updates during movement are ignored
        })
      );

      // Motion change listener - save location when user STOPS moving
      // This is the main trigger for location updates in background
      subs.push(
        BackgroundGeolocation.onMotionChange(event => {
          console.log('[useLocation] Motion change:', {
            isMoving: event.isMoving,
            location: event.location?.coords,
          });

          if (!event.isMoving) {
            // User stopped moving - request a fresh, accurate GPS fix
            // The event.location might be stale (last recorded during movement)
            console.log(
              '[useLocation] User stopped - requesting fresh location...'
            );

            BackgroundGeolocation.getCurrentPosition({
              samples: 3,
              persist: true,
              timeout: 30,
              maximumAge: 0, // Force fresh location, no cache
              desiredAccuracy: 10, // 10m accuracy requirement
            })
              .then(location => {
                console.log('[useLocation] Fresh stationary location:', {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  accuracy: location.coords.accuracy,
                });
                setLocation({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });
              })
              .catch(err => {
                // Fallback to the event location if getCurrentPosition fails
                console.warn(
                  '[useLocation] Failed to get fresh location, using event location:',
                  err
                );
                if (event.location?.coords) {
                  setLocation({
                    latitude: event.location.coords.latitude,
                    longitude: event.location.coords.longitude,
                  });
                }
              });
          }
        })
      );

      // Activity change listener - log activity changes for debugging
      // Note: We let the plugin manage motion state automatically via its built-in
      // elasticity (distanceFilter increases at higher speeds) for better battery efficiency
      subs.push(
        BackgroundGeolocation.onActivityChange(event => {
          console.log(
            '[useLocation] Activity changed:',
            event.activity,
            event.confidence
          );
        })
      );

      // Configure plugin
      await BackgroundGeolocation.ready({
        url,
        method: 'PATCH' as any,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        locationTemplate:
          '{"latitude":<%= latitude %>,"longitude":<%= longitude %>}',
        httpRootProperty: '.',
        autoSync: true,
        batchSync: false,
        maxRecordsToPersist: 50,
        disableLocationAuthorizationAlert: true,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
        distanceFilter: 5, // Record location every 5m for better accuracy when entering stationary
        stopTimeout: 2, // 2 minutes of stillness before entering stationary state
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true, // Android: allows background service to continue when app is killed
        showsBackgroundLocationIndicator: false,
        debug: false, // Enable sounds and notifications for location events
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF, // Verbose logging
      });
    };

    setup();

    return () => subs.forEach(s => s.remove());
  }, [userId, initialized, setLocation]);

  // 2. Toggle tracking based on fake location
  useEffect(() => {
    if (!initialized) return;

    const toggle = async () => {
      if (useFakeLocation) {
        console.log('[useLocation] Fake location ON, using:', fakeLocation);
        isFetchingPositionRef.current = false;
        setIsLocationLoading(false);
        await BackgroundGeolocation.stop();
        if (fakeLocation) setLocation(fakeLocation);
      } else {
        console.log('[useLocation] Fake location OFF, starting real tracking');
        // Set loading state BEFORE requesting position
        isFetchingPositionRef.current = true;
        setIsLocationLoading(true);

        await BackgroundGeolocation.start();
        // Request fresh location - result delivered via onLocation listener
        BackgroundGeolocation.getCurrentPosition({
          samples: 3, // Multiple samples for better accuracy
          persist: true,
          timeout: 15,
          maximumAge: 10000, // Only accept cached if < 10s old
          desiredAccuracy: 20, // 20m accuracy
        }).catch(err => {
          console.warn('[useLocation] getCurrentPosition failed:', err);
          isFetchingPositionRef.current = false;
          setIsLocationLoading(false);
        });
      }
    };

    toggle();
  }, [
    useFakeLocation,
    fakeLocation,
    initialized,
    setLocation,
    setIsLocationLoading,
  ]);

  // 3. Foreground refresh
  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = next;

      if (wasBackground && next === 'active' && !useFakeLocation) {
        // Set loading state for foreground refresh
        isFetchingPositionRef.current = true;
        setIsLocationLoading(true);

        BackgroundGeolocation.getCurrentPosition({
          samples: 3,
          persist: true, // Also sync to server
          timeout: 30,
          maximumAge: 0, // Force fresh location, no cache
          desiredAccuracy: 15,
        }).catch(() => {
          isFetchingPositionRef.current = false;
          setIsLocationLoading(false);
        });
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [useFakeLocation, setIsLocationLoading]);

  return { location, useFakeLocation, isLocationLoading };
};
