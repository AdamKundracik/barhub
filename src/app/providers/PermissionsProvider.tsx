import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  requestCameraPermission,
  requestGeolocationPermission,
  requestNotificationPermission,
  requestTrackingPermission,
} from '../utils/services/permission.service';

type PermissionsState = {
  camera: boolean;
  geolocation: boolean;
  notification: boolean;
  tracking: boolean;
};

type PermissionsContextType = {
  permissions: PermissionsState;
  isLoadingPermissions: boolean;
  checkPermissions: () => Promise<void>;
  requestCameraPermission: () => Promise<boolean>;
  requestGeolocationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  requestTrackingPermission: () => Promise<boolean>;
  hasAllPermissions: boolean;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

  const handleRequestCameraPermission = async () => {
    const granted = await requestCameraPermission();
    setPermissions(prev => ({
      ...prev,
      camera: granted,
    }));
    return granted;
  };

  const handleRequestGeolocationPermission = async () => {
    const granted = await requestGeolocationPermission();
    setPermissions(prev => ({
      ...prev,
      geolocation: granted,
    }));
    return granted;
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissions(prev => ({
      ...prev,
      notification: granted,
    }));
    return granted;
  };

  const handleRequestTrackingPermission = async () => {
    const granted = await requestTrackingPermission();
    setPermissions(prev => ({
      ...prev,
      tracking: Platform.OS === 'android' || granted,
    }));
    return granted;
  };

  const hasAllPermissions = Object.values(permissions).every(p => p);

  useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isLoadingPermissions,
        checkPermissions,
        requestCameraPermission: handleRequestCameraPermission,
        requestGeolocationPermission: handleRequestGeolocationPermission,
        requestNotificationPermission: handleRequestNotificationPermission,
        requestTrackingPermission: handleRequestTrackingPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsProvider = () => {
  const context = useContext(PermissionsContext);
  if (!context)
    throw new Error('usePermissions must be used within a PermissionsProvider');
  return context;
};
