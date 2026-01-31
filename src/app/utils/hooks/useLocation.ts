import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import * as Location from 'expo-location';
import { useLocationStore } from '../store/locationStore';
import { tokenManager } from '@/src/app/utils/api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '@/src/app/config/api';
import { useUserStore } from '@/src/app/utils/store/userStore';
import {
  registerBackgroundLocationTask,
  unregisterBackgroundLocationTask,
} from '../backgroundLocationTask';

// Helper function to sync location to backend (used by Android)
async function syncLocationToBackend(
  userId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    const token = await tokenManager.getAccessToken();
    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (response.ok) {
      console.log('[useLocation] Location synced to backend successfully');
    } else {
      console.warn('[useLocation] Failed to sync location:', response.status);
    }
  } catch (error) {
    console.error('[useLocation] Error syncing location:', error);
  }
}

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

  // ============================================
  // iOS ONLY: Setup react-native-background-geolocation
  // ============================================
  useEffect(() => {
    // Skip on Android - we use expo-background-task instead
    if (Platform.OS !== 'ios') return;
    if (!userId || !initialized) return;

    let subs: Array<{ remove: () => void }> = [];

    const setup = async () => {
      const token = await tokenManager.getAccessToken();
      const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`;

      // Location listener - only save location for explicit requests (getCurrentPosition)
      subs.push(
        BackgroundGeolocation.onLocation(event => {
          if (!event.coords) return;

          // Skip intermediate samples - wait for final accurate location
          if (event.sample) {
            console.log(
              '[useLocation:iOS] Skipping sample location, waiting for final...'
            );
            return;
          }

          // Only save location if we explicitly requested it (getCurrentPosition)
          if (isFetchingPositionRef.current) {
            console.log('[useLocation:iOS] Explicit request - saving location:', {
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
        })
      );

      // Motion change listener - save location when user STOPS moving
      subs.push(
        BackgroundGeolocation.onMotionChange(event => {
          console.log('[useLocation:iOS] Motion change:', {
            isMoving: event.isMoving,
            location: event.location?.coords,
          });

          if (!event.isMoving) {
            console.log(
              '[useLocation:iOS] User stopped - requesting fresh location...'
            );

            BackgroundGeolocation.getCurrentPosition({
              samples: 3,
              persist: true,
              timeout: 30,
              maximumAge: 0,
              desiredAccuracy: 10,
            })
              .then(location => {
                console.log('[useLocation:iOS] Fresh stationary location:', {
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
                console.warn(
                  '[useLocation:iOS] Failed to get fresh location, using event location:',
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

      // Activity change listener
      subs.push(
        BackgroundGeolocation.onActivityChange(event => {
          console.log(
            '[useLocation:iOS] Activity changed:',
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
        distanceFilter: 5,
        stopTimeout: 2,
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        showsBackgroundLocationIndicator: false,
        debug: false,
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
      });
    };

    setup();

    return () => subs.forEach(s => s.remove());
  }, [userId, initialized, setLocation]);

  // ============================================
  // Toggle tracking based on fake location
  // ============================================
  useEffect(() => {
    if (!initialized) return;

    const toggle = async () => {
      if (useFakeLocation) {
        console.log(`[useLocation:${Platform.OS}] Fake location ON, using:`, fakeLocation);
        isFetchingPositionRef.current = false;
        setIsLocationLoading(false);

        if (Platform.OS === 'ios') {
          // iOS: Stop BackgroundGeolocation
          await BackgroundGeolocation.stop();
        } else {
          // Android: Unregister background task
          await unregisterBackgroundLocationTask();
        }

        if (fakeLocation) setLocation(fakeLocation);
      } else {
        console.log(`[useLocation:${Platform.OS}] Fake location OFF, starting real tracking`);
        isFetchingPositionRef.current = true;
        setIsLocationLoading(true);

        if (Platform.OS === 'ios') {
          // iOS: Start BackgroundGeolocation
          await BackgroundGeolocation.start();
          BackgroundGeolocation.getCurrentPosition({
            samples: 3,
            persist: true,
            timeout: 15,
            maximumAge: 10000,
            desiredAccuracy: 20,
          }).catch(err => {
            console.warn('[useLocation:iOS] getCurrentPosition failed:', err);
            isFetchingPositionRef.current = false;
            setIsLocationLoading(false);
          });
        } else {
          // Android: Use expo-location + expo-background-task
          try {
            // Request permissions if not granted
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              console.warn('[useLocation:Android] Location permission not granted');
              isFetchingPositionRef.current = false;
              setIsLocationLoading(false);
              return;
            }

            // Get current location
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            console.log('[useLocation:Android] Got location:', {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              accuracy: currentLocation.coords.accuracy,
            });

            setLocation({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

            // Sync to backend
            if (userId) {
              await syncLocationToBackend(
                userId,
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
              );
            }

            // Register background task for periodic updates
            await registerBackgroundLocationTask();
          } catch (error) {
            console.warn('[useLocation:Android] Failed to get location:', error);
          } finally {
            isFetchingPositionRef.current = false;
            setIsLocationLoading(false);
          }
        }
      }
    };

    toggle();
  }, [
    useFakeLocation,
    fakeLocation,
    initialized,
    setLocation,
    setIsLocationLoading,
    userId,
  ]);

  // ============================================
  // Foreground refresh when app becomes active
  // ============================================
  useEffect(() => {
    const handleAppState = async (next: AppStateStatus) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = next;

      if (wasBackground && next === 'active' && !useFakeLocation) {
        isFetchingPositionRef.current = true;
        setIsLocationLoading(true);

        if (Platform.OS === 'ios') {
          // iOS: Use BackgroundGeolocation
          BackgroundGeolocation.getCurrentPosition({
            samples: 3,
            persist: true,
            timeout: 30,
            maximumAge: 0,
            desiredAccuracy: 15,
          }).catch(() => {
            isFetchingPositionRef.current = false;
            setIsLocationLoading(false);
          });
        } else {
          // Android: Use expo-location
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            console.log('[useLocation:Android] Foreground refresh - got location:', {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

            setLocation({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

            // Sync to backend
            if (userId) {
              await syncLocationToBackend(
                userId,
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
              );
            }
          } catch (error) {
            console.warn('[useLocation:Android] Foreground refresh failed:', error);
          } finally {
            isFetchingPositionRef.current = false;
            setIsLocationLoading(false);
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [useFakeLocation, setIsLocationLoading, setLocation, userId]);

  return { location, useFakeLocation, isLocationLoading };
};
