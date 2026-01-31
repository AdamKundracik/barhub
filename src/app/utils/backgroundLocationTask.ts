import { Platform } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { useLocationStore } from './store/locationStore';
import { tokenManager } from './api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { useUserStore } from './store/userStore';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Define the background task in the global scope (required by expo-task-manager)
// This runs when the system triggers the background task on Android
if (Platform.OS === 'android') {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async () => {
    try {
      console.log(
        `[BackgroundLocationTask] Task triggered at: ${new Date().toISOString()}`
      );

      const locationStore = useLocationStore.getState();

      // Skip if using fake location
      if (locationStore.useFakeLocation) {
        console.log(
          '[BackgroundLocationTask] Using fake location, skipping GPS fetch'
        );
        return BackgroundTask.BackgroundTaskResult.Success;
      }

      // Check location permissions
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log(
          '[BackgroundLocationTask] Location permission not granted'
        );
        return BackgroundTask.BackgroundTaskResult.Failed;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 0,
      });

      console.log('[BackgroundLocationTask] Got location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      // Update local store
      locationStore.setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Sync to backend
      const userId = useUserStore.getState().getUserId();
      if (userId) {
        try {
          const token = await tokenManager.getAccessToken();
          const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`;

          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }),
          });

          if (response.ok) {
            console.log(
              '[BackgroundLocationTask] Location synced to backend successfully'
            );
          } else {
            console.warn(
              '[BackgroundLocationTask] Failed to sync location:',
              response.status
            );
          }
        } catch (error) {
          console.error(
            '[BackgroundLocationTask] Error syncing location:',
            error
          );
        }
      }

      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error('[BackgroundLocationTask] Task failed:', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

// Register the background task
export async function registerBackgroundLocationTask(): Promise<void> {
  if (Platform.OS !== 'android') {
    console.log(
      '[BackgroundLocationTask] Skipping registration - not Android'
    );
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_LOCATION_TASK
    );

    if (isRegistered) {
      console.log('[BackgroundLocationTask] Task already registered');
      return;
    }

    await BackgroundTask.registerTaskAsync(BACKGROUND_LOCATION_TASK, {
      minimumInterval: 15, // Minimum 15 minutes (Android WorkManager minimum)
    });

    console.log('[BackgroundLocationTask] Task registered successfully');
  } catch (error) {
    console.error('[BackgroundLocationTask] Failed to register task:', error);
  }
}

// Unregister the background task
export async function unregisterBackgroundLocationTask(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_LOCATION_TASK
    );

    if (!isRegistered) {
      console.log('[BackgroundLocationTask] Task not registered');
      return;
    }

    await BackgroundTask.unregisterTaskAsync(BACKGROUND_LOCATION_TASK);
    console.log('[BackgroundLocationTask] Task unregistered successfully');
  } catch (error) {
    console.error(
      '[BackgroundLocationTask] Failed to unregister task:',
      error
    );
  }
}

// Get the status of background tasks
export async function getBackgroundTaskStatus(): Promise<BackgroundTask.BackgroundTaskStatus | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return await BackgroundTask.getStatusAsync();
  } catch (error) {
    console.error(
      '[BackgroundLocationTask] Failed to get status:',
      error
    );
    return null;
  }
}

// Check if the task is registered
export async function isBackgroundLocationTaskRegistered(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  } catch (error) {
    console.error(
      '[BackgroundLocationTask] Failed to check registration:',
      error
    );
    return false;
  }
}

// Trigger the task manually for testing (only works in development)
export async function triggerBackgroundTaskForTesting(): Promise<void> {
  if (Platform.OS !== 'android') {
    console.log('[BackgroundLocationTask] Testing only available on Android');
    return;
  }

  try {
    await BackgroundTask.triggerTaskWorkerForTestingAsync();
    console.log('[BackgroundLocationTask] Test trigger sent');
  } catch (error) {
    console.error(
      '[BackgroundLocationTask] Failed to trigger test:',
      error
    );
  }
}
