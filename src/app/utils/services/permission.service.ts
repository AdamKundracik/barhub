import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { requestCameraPermissionsAsync } from 'expo-image-picker';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import BackgroundGeolocation from 'react-native-background-geolocation';
import * as Location from 'expo-location';

export const requestTrackingPermission = async () => {
  if (Platform.OS === 'android') return true;
  try {
    const { status } = await requestTrackingPermissionsAsync();
    // Respect user's decision - don't retry if denied per Apple guidelines 5.1.1
    return status === 'granted';
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
    return authStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE || 
           authStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS;
  } catch (error) {
    console.error('Geolocation permission error:', error);
    return false;
  }
};

// Check permission status without requesting
export const checkGeolocationPermission = async () => {
  try {
    // Use expo-location for more reliable permission checking
    const { status } = await Location.getForegroundPermissionsAsync();
    const isGranted = status === 'granted';
    
    console.log('[checkGeolocationPermission] Expo Location status:', status, 'granted:', isGranted);
    
    // Also check BackgroundGeolocation state for consistency
    try {
      const bgState = await BackgroundGeolocation.getProviderState();
      const bgGranted = bgState.authorization === BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE || 
                       bgState.authorization === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS;
      console.log('[checkGeolocationPermission] BackgroundGeolocation authorization:', bgState.authorization, 'granted:', bgGranted);
      
      // Return true if either is granted (expo-location is primary source)
      return isGranted || bgGranted;
    } catch (bgError) {
      console.warn('[checkGeolocationPermission] BackgroundGeolocation check failed, using expo-location result:', bgError);
      return isGranted;
    }
  } catch (error) {
    console.error('Geolocation permission check error:', error);
    return false;
  }
};

// Get detailed geolocation permission status
export const getGeolocationPermissionStatus = async () => {
  try {
    // Use expo-location as primary source
    const expoStatus = await Location.getForegroundPermissionsAsync();
    const granted = expoStatus.status === 'granted';
    const canRequest = expoStatus.status === 'undetermined';
    const denied = expoStatus.status === 'denied';
    
    console.log('[getGeolocationPermissionStatus] Expo Location status:', expoStatus.status);
    
    // Also check BackgroundGeolocation for additional info
    let bgStatus = null;
    try {
      const bgState = await BackgroundGeolocation.getProviderState();
      bgStatus = bgState.authorization;
      console.log('[getGeolocationPermissionStatus] BackgroundGeolocation authorization:', bgStatus);
    } catch (bgError) {
      console.warn('[getGeolocationPermissionStatus] BackgroundGeolocation check failed:', bgError);
    }
    
    const result = {
      granted: granted,
      canRequest: canRequest,
      denied: denied,
      status: expoStatus.status,
      bgAuthorization: bgStatus
    };
    
    console.log('[getGeolocationPermissionStatus] Final result:', result);
    return result;
  } catch (error) {
    console.error('Geolocation permission status error:', error);
    return {
      granted: false,
      canRequest: false,
      denied: true,
      status: null,
      bgAuthorization: null
    };
  }
};