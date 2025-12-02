import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  requestGeolocationPermission,
  requestNotificationPermission,
  requestTrackingPermission,
  checkGeolocationPermission,
} from '../services/permission.service';
import * as Notifications from 'expo-notifications';
import { getTrackingPermissionsAsync } from 'expo-tracking-transparency';

export type PermissionType =
  | 'geolocation'
  | 'notification'
  | 'tracking';

type PermissionsState = Record<PermissionType, boolean>;

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    tracking: Platform.OS === 'android', // Android doesn't need tracking permission
    notification: false,
    geolocation: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const permissionRequestMap = useCallback(() => ({
    geolocation: requestGeolocationPermission,
    notification: requestNotificationPermission,
    tracking: requestTrackingPermission,
  }), []);

  const checkAllPermissions = useCallback(async () => {
    console.log('[usePermissions] Checking all permissions...');
    setIsLoading(true);
    try {
      // Check permissions status without requesting them
      const permissionChecks = [
        // Check tracking permission status
        Platform.OS === 'android' 
          ? Promise.resolve(true)
          : getTrackingPermissionsAsync().then(result => result.status === 'granted'),
        // Check notification permission status
        Notifications.getPermissionsAsync().then(result => result.status === 'granted'),
        // Check geolocation permission status
        checkGeolocationPermission(),
      ];

      const permissionTypes = ['tracking', 'notification', 'geolocation'] as const;

      // Wait for all permissions to resolve and process results
      const results = await Promise.allSettled(permissionChecks);
      
      const newPermissions: PermissionsState = {
        tracking: Platform.OS === 'android', // Default for Android
        notification: false,
        geolocation: false,
      };

      results.forEach((result, index) => {
        const permissionType = permissionTypes[index];
        
        if (result.status === 'fulfilled') {
          newPermissions[permissionType] = permissionType === 'tracking' 
            ? Platform.OS === 'android' || result.value 
            : result.value;
        } else {
          console.error(`Error checking ${permissionType} permission:`, result.reason);
        }
      });

      setPermissions(newPermissions);
      console.log('[usePermissions] Updated permissions:', newPermissions);

    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  const requestPermission = useCallback(async (type: PermissionType): Promise<boolean> => {
    try {
      const granted = await permissionRequestMap()[type]();

      const finalValue = type === 'tracking' ? Platform.OS === 'android' || granted : granted;

      setPermissions(prev => ({
        ...prev,
        [type]: finalValue,
      }));

      return granted;
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return false;
    }
  }, [permissionRequestMap]);

  const hasAllPermissions = Object.values(permissions).every(Boolean);

  const getRequiredPermissions = (): PermissionType[] => {
    const required: PermissionType[] = [];

    // TEMPORARILY DISABLED FOR TESTING - location permission not required
    // if (Platform.OS !== 'web') {
    //   required.push('geolocation');
    // }

    // Camera permission is requested when user opens camera (on-demand)
    // Notification and tracking are optional per Apple guidelines
    // 4.5.4 (push notifications must be optional)
    // 5.1.2(i) (tracking must be optional)

    return required;
  };

  const hasAllRequiredPermissions = useCallback((): boolean => {
    return getRequiredPermissions().every(type => permissions[type]);
  }, [permissions]);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  return {
    permissions,
    isLoading,
    checkAllPermissions,
    requestPermission,
    hasAllPermissions,
    hasAllRequiredPermissions,
    getRequiredPermissions,
  };
};