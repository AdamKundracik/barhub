import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
    // Android tracking uses expo-location (transistorsoft has no license here
    // and would show its license popup). useLocation.ts already requests
    // foreground+background permission via expo-location on Android, so on
    // that platform we just report current state via expo-location too.
    if (Platform.OS === 'android') {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    }

    const authStatus = await BackgroundGeolocation.requestPermission();
    return (
      authStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE ||
      authStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS
    );
  } catch (error) {
    console.error('Geolocation permission error:', error);
    return false;
  }
};

// Cache for permission status to prevent infinite loops
let permissionCache: { status: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 5000; // 5 seconds cache (increased from 2s)
let lastClearTime = 0;
const MIN_CLEAR_INTERVAL = 3000; // Minimum 3 seconds between cache clears

// Clear permission cache (useful when user changes permissions in settings)
export const clearGeolocationPermissionCache = () => {
  const now = Date.now();

  // Prevent excessive cache clearing
  if (now - lastClearTime < MIN_CLEAR_INTERVAL) {
    console.log(
      '[clearGeolocationPermissionCache] Skipping cache clear - too frequent'
    );
    return;
  }

  permissionCache = null;
  lastClearTime = now;
  console.log('[clearGeolocationPermissionCache] Permission cache cleared');
};

// Track API calls to prevent excessive requests
let lastApiCall = 0;
const MIN_API_INTERVAL = 1000; // Minimum 1 second between API calls
let isCheckingPermission = false; // Global flag to prevent concurrent checks

// Check permission status without requesting
export const checkGeolocationPermission = async (
  forceRefresh: boolean = false
) => {
  try {
    const now = Date.now();

    // If force refresh, clear cache first
    if (forceRefresh) {
      permissionCache = null;
      console.log('[checkGeolocationPermission] Force refresh - cache cleared');
    }

    // Check cache first to prevent infinite loops (unless force refresh)
    if (
      !forceRefresh &&
      permissionCache &&
      now - permissionCache.timestamp < CACHE_DURATION
    ) {
      console.log(
        '[checkGeolocationPermission] Using cached result:',
        permissionCache.status
      );
      return permissionCache.status;
    }

    // Prevent concurrent permission checks
    if (isCheckingPermission) {
      console.log(
        '[checkGeolocationPermission] Permission check already in progress globally'
      );
      return permissionCache?.status ?? false;
    }

    // Prevent excessive API calls (unless force refresh)
    if (!forceRefresh && now - lastApiCall < MIN_API_INTERVAL) {
      console.log(
        '[checkGeolocationPermission] API call too frequent, using last cached result or default'
      );
      return permissionCache?.status ?? false;
    }

    isCheckingPermission = true;
    lastApiCall = now;

    try {
      // Use expo-location for more reliable permission checking
      const { status } = await Location.getForegroundPermissionsAsync();
      const isGranted = status === 'granted';

      console.log(
        '[checkGeolocationPermission] Expo Location status:',
        status,
        'granted:',
        isGranted
      );

      // Cache the result
      permissionCache = { status: isGranted, timestamp: now };

      return isGranted;
    } finally {
      isCheckingPermission = false;
    }
  } catch (error) {
    console.error('Geolocation permission check error:', error);
    // Cache negative result to prevent repeated failures
    const now = Date.now();
    permissionCache = { status: false, timestamp: now };
    lastApiCall = now;
    isCheckingPermission = false;
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

    console.log(
      '[getGeolocationPermissionStatus] Expo Location status:',
      expoStatus.status
    );

    // Also check BackgroundGeolocation for additional info (iOS only —
    // calling it on Android would trigger transistorsoft's license popup).
    let bgStatus = null;
    if (Platform.OS === 'ios') {
      try {
        const bgState = await BackgroundGeolocation.getProviderState();
        bgStatus = bgState.accuracyAuthorization;
        console.log(
          '[getGeolocationPermissionStatus] BackgroundGeolocation authorization:',
          bgStatus
        );
      } catch (bgError) {
        console.warn(
          '[getGeolocationPermissionStatus] BackgroundGeolocation check failed:',
          bgError
        );
      }
    }

    const result = {
      granted: granted,
      canRequest: canRequest,
      denied: denied,
      status: expoStatus.status,
      bgAuthorization: bgStatus,
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
      bgAuthorization: null,
    };
  }
};
