import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  requestCameraPermission,
  requestGeolocationPermission,
  requestNotificationPermission,
  requestTrackingPermission,
} from '../services/permission.service';

export type PermissionType =
  | 'camera'
  | 'geolocation'
  | 'notification'
  | 'tracking';

type PermissionsState = Record<PermissionType, boolean>;

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    tracking: Platform.OS === 'android', // Android doesn't need tracking permission
    camera: false,
    notification: false,
    geolocation: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const permissionRequestMap = {
    camera: requestCameraPermission,
    geolocation: requestGeolocationPermission,
    notification: requestNotificationPermission,
    tracking: requestTrackingPermission,
  };

  const checkAllPermissions = async () => {
    setIsLoading(true);
    try {
      // Check permissions in parallel and process results properly
      const permissionChecks = [
        requestTrackingPermission(),
        requestCameraPermission(),
        requestNotificationPermission(),
        requestGeolocationPermission(),
      ];

      const permissionTypes = ['tracking', 'camera', 'notification', 'geolocation'] as const;

      // Wait for all permissions to resolve and process results
      const results = await Promise.allSettled(permissionChecks);
      
      const newPermissions: PermissionsState = {
        tracking: Platform.OS === 'android', // Default for Android
        camera: false,
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

    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async (type: PermissionType): Promise<boolean> => {
    try {
      const granted = await permissionRequestMap[type]();

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
  };

  const hasAllPermissions = Object.values(permissions).every(Boolean);

  const getRequiredPermissions = (): PermissionType[] => {
    const required: PermissionType[] = ['camera', 'notification'];

    if (Platform.OS !== 'web') {
      required.push('geolocation');
    }

    if (Platform.OS === 'ios') {
      required.push('tracking');
    }

    return required;
  };

  const hasAllRequiredPermissions = (): boolean => {
    return getRequiredPermissions().every(type => permissions[type]);
  };

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