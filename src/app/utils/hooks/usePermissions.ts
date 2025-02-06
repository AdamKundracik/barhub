import { useState } from 'react';
import {
  requestCameraPermission,
  requestGeolocationPermission,
  requestNotificationPermission,
  requestTrackingPermission,
} from '../services/permission.service';
import { Platform } from 'react-native';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
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

  return { permissions, isLoadingPermissions, checkPermissions };
};
