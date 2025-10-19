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
      const [tracking, camera, notification, geolocation] = await Promise.all([
        requestTrackingPermission(),
        requestCameraPermission(),
        requestNotificationPermission(),
        requestGeolocationPermission(),
      ]);

      setPermissions({
        tracking: Platform.OS === 'android' || tracking,
        camera,
        notification,
        geolocation,
      });
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