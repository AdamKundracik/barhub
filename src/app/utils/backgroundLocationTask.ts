import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useLocationStore } from './store/locationStore';
import { useUserStore } from './store/userStore';
import { axiosClient } from './api/axiosClient';
import { ENDPOINTS } from '../config/api';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

const MIN_UPDATE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
let lastUpdateTimestamp = 0;

// Must be defined in global scope, outside any component
if (Platform.OS === 'android') {
  TaskManager.defineTask(
    BACKGROUND_LOCATION_TASK,
    async ({ data, error }: any) => {
      if (error) {
        console.error('[BG Location] Error:', error.message);
        return;
      }

      const locations: Location.LocationObject[] = data?.locations;
      if (!locations?.length) return;

      const now = Date.now();
      if (now - lastUpdateTimestamp < MIN_UPDATE_INTERVAL_MS) {
        return;
      }
      lastUpdateTimestamp = now;

      const { latitude, longitude } = locations[0].coords;
      console.log(
        '[BG Location] Got location:',
        latitude,
        longitude,
        new Date().toISOString()
      );

      if (useLocationStore.getState().useFakeLocation) return;

      useLocationStore.getState().setLocation({ latitude, longitude });

      // After kill+wake, the foreground-service callback fires before React
      // mounts and re-fetches /users/me. Wait for the persisted userData to
      // hydrate from AsyncStorage before reading the user id.
      if (!useUserStore.persist.hasHydrated()) {
        await new Promise<void>(resolve => {
          const unsub = useUserStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        });
      }

      const userId = useUserStore.getState().userData?.id?.toString();
      if (!userId) return;

      try {
        // Use axiosClient so the 401 → refresh → retry interceptor runs
        // while the foreground service fires this task in the background.
        await axiosClient.patch(ENDPOINTS.USERS.LOCATION(userId), {
          latitude,
          longitude,
        });
      } catch (err) {
        console.error('[BG Location] Sync failed:', err);
      }
    }
  );
}

export async function registerBackgroundTask(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15 * 60 * 1000, // 15 minutes
    distanceInterval: 100,
    deferredUpdatesInterval: 15 * 60 * 1000,
    deferredUpdatesDistance: 100,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'Location Active',
      notificationBody: 'Tracking your location in the background.',
      notificationColor: '#ffffff',
    },
  });

  console.log('[BG Location] Foreground service started');
}

export async function unregisterBackgroundTask(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (!isRegistered) return;

  await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  console.log('[BG Location] Foreground service stopped');
}
