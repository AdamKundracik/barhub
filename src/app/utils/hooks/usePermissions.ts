import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  requestCameraPermission,
  requestGeolocationPermission,
  requestNotificationPermission,
  requestTrackingPermission,
} from '../services/permission.service';

type PermissionsState = {
  camera: boolean;
  geolocation: boolean;
  notification: boolean;
  tracking: boolean;
};

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    tracking: Platform.OS === 'android',
    camera: false,
    notification: false,
    geolocation: false,
  });
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const checkPermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const results = await Promise.all([
        requestTrackingPermission(),
        requestCameraPermission(),
        requestNotificationPermission(),
        requestGeolocationPermission(),
      ]);

      setPermissions(prev => ({
        ...prev,
        tracking: Platform.OS === 'android' || results[0],
        camera: results[1],
        notification: results[2],
        geolocation: results[3],
      }));
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
    setIsLoadingPermissions(false);
  };

  const requestPermission = async (type: keyof PermissionsState) => {
    let granted = false;

    switch (type) {
      case 'camera':
        granted = await requestCameraPermission();
        break;
      case 'geolocation':
        granted = await requestGeolocationPermission();
        break;
      case 'notification':
        granted = await requestNotificationPermission();
        break;
      case 'tracking':
        granted = await requestTrackingPermission();
        break;
    }

    setPermissions(prev => ({
      ...prev,
      [type]:
        type === 'tracking' ? Platform.OS === 'android' || granted : granted,
    }));

    return granted;
  };

  const hasAllPermissions = Object.values(permissions).every(p => p);

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissions,
    isLoadingPermissions,
    checkPermissions,
    requestPermission,
    hasAllPermissions,
  };
};
