/**
 * Android Background Location Task
 * Uses expo-background-task (WorkManager) - runs every 15+ minutes
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useLocationStore } from './store/locationStore';
import { useUserStore } from './store/userStore';
import { tokenManager } from './api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '../config/api';

export const BACKGROUND_TASK_NAME = 'background-location-task';

// Define task (Android only)
if (Platform.OS === 'android') {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    console.log('[BG Task] Triggered:', new Date().toISOString());

    try {
      // Skip if fake location
      if (useLocationStore.getState().useFakeLocation) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }

      // Get location
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('[BG Task] Location:', coords.latitude, coords.longitude);

      // Update store
      useLocationStore.getState().setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      // Sync to backend
      const userId = useUserStore.getState().userData?.id?.toString();
      if (userId) {
        const token = await tokenManager.getAccessToken();
        await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`, {
          method: 'PATCH',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        });
      }

      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error('[BG Task] Error:', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

// Register task
export async function registerBackgroundTask() {
  if (Platform.OS !== 'android') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  if (isRegistered) return;

  await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
    minimumInterval: 15,
  });
  console.log('[BG Task] Registered');
}

// Unregister task
export async function unregisterBackgroundTask() {
  if (Platform.OS !== 'android') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  if (!isRegistered) return;

  await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
  console.log('[BG Task] Unregistered');
}
