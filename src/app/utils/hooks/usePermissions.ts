import { Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  requestCameraPermission,
  requestGeolocationPermission,
  requestNotificationPermission,
  requestTrackingPermission,
} from '../services/permission.service';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
    tracking: Platform.OS === 'android',
    camera: false,
    notification: false,
    geolocation: false,
  });
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Add a memoized value for hasAllPermissions
  const hasAllPermissions = useMemo(() => {
    const allGranted =
      permissions.tracking &&
      permissions.camera &&
      permissions.notification &&
      permissions.geolocation;

    console.log(
      'usePermissions - calculated hasAllPermissions:',
      allGranted,
      'with permissions:',
      permissions
    );
    return allGranted;
  }, [permissions]);

  const checkPermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const results = await Promise.all([
        requestTrackingPermission(),
        requestCameraPermission(),
        requestNotificationPermission(),
        requestGeolocationPermission(),
      ]);

      const newPermissions = {
        tracking: Platform.OS === 'android' || results[0],
        camera: results[1],
        notification: results[2],
        geolocation: results[3],
      };

      console.log('Setting new permissions:', newPermissions);
      setPermissions(newPermissions);
      return newPermissions;
    } catch (error) {
      console.error('Permission check error:', error);
      return permissions;
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissions,
    isLoadingPermissions,
    checkPermissions,
    hasAllPermissions, // Add this to the return value
  };
};
