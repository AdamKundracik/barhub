import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useLocationStore } from './store/locationStore';
import { useUserStore } from './store/userStore';
import { tokenManager } from './api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '../config/api';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

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

      const { latitude, longitude } = locations[0].coords;
      console.log(
        '[BG Location] Got location:',
        latitude,
        longitude,
        new Date().toISOString()
      );

      // Skip if fake location is active
      if (useLocationStore.getState().useFakeLocation) return;

      // Update store
      useLocationStore.getState().setLocation({ latitude, longitude });

      // Sync to backend
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
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 120000, // ms — minimum time between updates
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Location active',
      notificationBody: 'Your location is being tracked.',
      notificationColor: '#000000',
    },
    pausesUpdatesAutomatically: false,
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
