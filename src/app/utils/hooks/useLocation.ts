/**
 * Location Hook
 * iOS: react-native-background-geolocation (transistorsoft)
 * Android: expo-background-task + expo-location
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import * as Location from 'expo-location';
import { useLocationStore } from '../store/locationStore';
import { useUserStore } from '../store/userStore';
import { tokenManager } from '../api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '../../config/api';
import {
  registerBackgroundTask,
  unregisterBackgroundTask,
} from '../backgroundLocationTask';

type Coords = { latitude: number; longitude: number };

BackgroundGeolocation.getLog(log => {
  console.log('[BGGeo] Log:', log);
});

// Sync location to backend
async function syncToBackend(userId: string, coords: Coords) {
  const token = await tokenManager.getAccessToken();
  await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`, {
    method: 'PATCH',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(coords),
  }).catch(() => {});
}

export function useLocation() {
  const {
    useFakeLocation,
    location,
    setLocation,
    initialized,
    fakeLocation,
    isLocationLoading,
    setIsLocationLoading,
  } = useLocationStore();

  const userId = useUserStore(s => s.userData?.id?.toString());
  const appState = useRef(AppState.currentState);
  const subs = useRef<Array<{ remove: () => void }>>([]);

  // ===========================================
  // iOS: Setup BackgroundGeolocation
  // ===========================================
  useEffect(() => {
    if (Platform.OS !== 'ios' || !userId || !initialized) return;

    const setup = async () => {
      const token = await tokenManager.getAccessToken();

      subs.current.push(
        BackgroundGeolocation.onLocation(e => {
          if (e.coords && !e.sample) {
            setLocation({
              latitude: e.coords.latitude,
              longitude: e.coords.longitude,
            });
          }
        }),
        BackgroundGeolocation.onMotionChange(e => {
          if (!e.isMoving && e.location?.coords) {
            setLocation({
              latitude: e.location.coords.latitude,
              longitude: e.location.coords.longitude,
            });
          }
        })
      );

      await BackgroundGeolocation.ready({
        url: `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`,
        method: 'PATCH' as any,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        locationTemplate:
          '{"latitude":<%= latitude %>,"longitude":<%= longitude %>}',
        httpRootProperty: '.',
        autoSync: true,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 50,
        stopTimeout: 5,
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        showsBackgroundLocationIndicator: false,
        debug: false,
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
      });
    };

    setup();
    return () => {
      subs.current.forEach(s => s.remove());
      subs.current = [];
    };
  }, [userId, initialized, setLocation]);

  // ===========================================
  // Toggle: Real vs Fake location
  // ===========================================
  useEffect(() => {
    if (!initialized) return;

    const toggle = async () => {
      // Fake location ON
      if (useFakeLocation) {
        setIsLocationLoading(false);
        Platform.OS === 'ios'
          ? await BackgroundGeolocation.stop()
          : await unregisterBackgroundTask();
        if (fakeLocation) setLocation(fakeLocation);
        return;
      }

      // Real tracking ON
      setIsLocationLoading(true);

      if (Platform.OS === 'ios') {
        await BackgroundGeolocation.start();
        BackgroundGeolocation.getCurrentPosition({
          samples: 3,
          persist: true,
          timeout: 15,
        })
          .then(loc =>
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            })
          )
          .finally(() => setIsLocationLoading(false));
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setIsLocationLoading(false);
          return;
        }

        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        if (userId)
          syncToBackend(userId, {
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        await registerBackgroundTask();
        setIsLocationLoading(false);
      }
    };

    toggle();
  }, [
    useFakeLocation,
    fakeLocation,
    initialized,
    userId,
    setLocation,
    setIsLocationLoading,
  ]);

  // ===========================================
  // Foreground refresh
  // ===========================================
  useEffect(() => {
    const handler = async (next: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = next;

      if (!wasBackground || next !== 'active' || useFakeLocation) return;

      setIsLocationLoading(true);

      if (Platform.OS === 'ios') {
        BackgroundGeolocation.getCurrentPosition({
          samples: 3,
          persist: true,
          timeout: 30,
        })
          .then(loc =>
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            })
          )
          .finally(() => setIsLocationLoading(false));
      } else {
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        if (userId)
          syncToBackend(userId, {
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        setIsLocationLoading(false);
      }
    };

    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [useFakeLocation, userId, setLocation, setIsLocationLoading]);

  return { location, useFakeLocation, isLocationLoading };
}
