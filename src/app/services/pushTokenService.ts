import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userService } from './userService';
import { useUserStore } from '../utils/store/userStore';

class PushTokenService {
  private static instance: PushTokenService;
  private currentToken: string | null = null;

  static getInstance(): PushTokenService {
    if (!PushTokenService.instance) {
      PushTokenService.instance = new PushTokenService();
    }
    return PushTokenService.instance;
  }

  /**
   * Get Expo push token for the current device
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      // Check permissions first
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn(
          '[PushTokenService] Permission not granted for push notifications'
        );
        return null;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Get project ID
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error('[PushTokenService] Project ID not found');
        return null;
      }

      // Get push token based on platform
      let pushTokenString: string;
      if (Platform.OS === 'ios') {
        pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants?.expoConfig?.extra?.eas.projectId,
          })
        ).data;
      } else {
        pushTokenString = (await Notifications.getDevicePushTokenAsync()).data;
      }

      // console.log('[PushTokenService] Successfully obtained push token');
      this.currentToken = pushTokenString;
      return pushTokenString;
    } catch (error) {
      console.error('[PushTokenService] Error getting push token:', error);
      return null;
    }
  }

  /**
   * Save push token to backend for current user
   */
  async savePushTokenToBackend(userId: string): Promise<boolean> {
    try {
      if (!this.currentToken) {
        // console.log('[PushTokenService] No current token to save');
        return false;
      }

      // console.log(
      //   '[PushTokenService] Saving push token to backend for user:',
      //   userId
      // );
      const success = await userService.addPushToken(userId, this.currentToken);

      if (success) {
        // console.log('[PushTokenService] Push token saved successfully');
        // Update user store
        const { setCurrentPushToken } = useUserStore.getState();
        setCurrentPushToken(this.currentToken);
      } else {
        console.error(
          '[PushTokenService] Failed to save push token to backend'
        );
      }

      return success;
    } catch (error) {
      console.error(
        '[PushTokenService] Error saving push token to backend:',
        error
      );
      return false;
    }
  }

  /**
   * Remove push token from backend for current user
   */
  async removePushTokenFromBackend(userId: string): Promise<boolean> {
    try {
      if (!this.currentToken) {
        // console.log('[PushTokenService] No current token to remove');
        return true; // Nothing to remove
      }

      // console.log(
      //   '[PushTokenService] Removing push token from backend for user:',
      //   userId
      // );
      const success = await userService.removePushToken(
        userId,
        this.currentToken
      );

      if (success) {
        // console.log('[PushTokenService] Push token removed successfully');
        // Clear from user store
        const { setCurrentPushToken } = useUserStore.getState();
        setCurrentPushToken(null);
        this.currentToken = null;
      } else {
        console.error(
          '[PushTokenService] Failed to remove push token from backend'
        );
      }

      return success;
    } catch (error) {
      console.error(
        '[PushTokenService] Error removing push token from backend:',
        error
      );
      return false;
    }
  }

  /**
   * Initialize push token service - get token and save to backend if user is authenticated
   */
  async initialize(userId?: string): Promise<string | null> {
    try {
      // console.log('[PushTokenService] Initializing push token service');

      // Check if user already has a push token stored
      const { currentPushToken } = useUserStore.getState();
      if (currentPushToken) {
        // User already has a push token, use it instead of fetching a new one
        this.currentToken = currentPushToken;
        // console.log('[PushTokenService] Using existing push token:', currentPushToken);
        return currentPushToken;
      }

      // Get push token only if user doesn't have one
      const token = await this.getExpoPushToken();

      if (token && userId) {
        // Save to backend if user is authenticated
        await this.savePushTokenToBackend(userId);
      }

      return token;
    } catch (error) {
      console.error(
        '[PushTokenService] Error initializing push token service:',
        error
      );
      return null;
    }
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Clear current token (for logout)
   */
  clearToken(): void {
    this.currentToken = null;
    const { setCurrentPushToken } = useUserStore.getState();
    setCurrentPushToken(null);
  }
}

export const pushTokenService = PushTokenService.getInstance();
