import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useLocationStore } from './store/locationStore';
import { useUserStore } from './store/userStore';
import { tokenManager } from './api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '../config/api';

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

      const userId = useUserStore.getState().userData?.id?.toString();
      if (!userId) return;

      try {
        const token = await tokenManager.getAccessToken();
        await fetch(
          `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`,
          {
            method: 'PATCH',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude }),
          }
        );
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
  console.log('TASK ALREADY REGISTERED', isRegistered);
  if (isRegistered) return;

  console.log('ABRAKADABRA');
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
