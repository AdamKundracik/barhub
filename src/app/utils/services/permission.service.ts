import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { requestCameraPermissionsAsync } from 'expo-image-picker';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import BackgroundGeolocation from 'react-native-background-geolocation';

export const requestTrackingPermission = async () => {
  if (Platform.OS === 'android') return true;
  try {
    const { status } = await requestTrackingPermissionsAsync();

    if (status !== 'granted') {
      const { status: newStatus } = await requestTrackingPermissionsAsync();
      return newStatus === 'granted';
    }

    return true;
  } catch (error) {
    console.error('Tracking permission error:', error);
    return false;
  }
};

export const requestCameraPermission = async () => {
  try {
    const { status } = await requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
};

export const requestNotificationPermission = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

export const requestGeolocationPermission = async () => {
  try {
    const authStatus = await BackgroundGeolocation.requestPermission();
    return authStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS;
  } catch (error) {
    console.error('Geolocation permission error:', error);
    return false;
  }
};