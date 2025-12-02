import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Icons from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { primaryColor, secondaryTextColor } from '../../../utils/styles/colors';
import { getGeolocationPermissionStatus } from '../../../utils/services/permission.service';
import { usePermissionsContext } from '../../../providers/PermissionsProvider';

interface LocationRequiredStateProps {
  requestPhoto: () => void;
}

const LocationRequiredState: React.FC<LocationRequiredStateProps> = ({
  requestPhoto,
}) => {
  const { t } = useTranslation();
  const { requestPermission, permissions, checkAllPermissions } = usePermissionsContext();
  const [canRequestPermission, setCanRequestPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const checkPermissionStatus = async () => {
      const status = await getGeolocationPermissionStatus();
      setCanRequestPermission(status.canRequest);
    };
    
    checkPermissionStatus();

    // Listen for app state changes to detect when user returns from Settings
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Re-check permission status when app becomes active
        console.log('[LocationRequiredState] App became active, re-checking permissions...');
        checkAllPermissions(); // This will update the permissions context
        checkPermissionStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [checkAllPermissions]);
  
  // Also listen to permissions changes from context
  useEffect(() => {
    console.log('[LocationRequiredState] Permissions changed:', permissions);
    if (permissions.geolocation) {
      // Permission was granted, component will unmount as FeedContent will show different UI
      console.log('[LocationRequiredState] Location permission granted!');
    } else {
      // Re-check if we can request permission
      const recheckStatus = async () => {
        const status = await getGeolocationPermissionStatus();
        setCanRequestPermission(status.canRequest);
      };
      recheckStatus();
    }
  }, [permissions.geolocation]);

  const handleRequestPermission = async () => {
    if (!canRequestPermission || isRequesting) return;
    
    setIsRequesting(true);
    try {
      await requestPermission('geolocation');
    } catch (error) {
      console.error('Error requesting location permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesomeIcon 
          icon={Icons.faLocationDot} 
          size={60} 
          color={primaryColor} 
        />
      </View>
      
      <Text style={styles.title}>
        {t('locationRequired.title')}
      </Text>
      
      <Text style={styles.subtitle}>
        {t('locationRequired.subtitle')}
      </Text>
      
      <Text style={styles.description}>
        {canRequestPermission 
          ? t('locationRequired.descriptionWithButton')
          : t('locationRequired.descriptionSettings')
        }
      </Text>

      {canRequestPermission && (
        <TouchableOpacity 
          style={styles.requestButton}
          onPress={handleRequestPermission}
          disabled={isRequesting}
        >
          <FontAwesomeIcon 
            icon={Icons.faLocationDot} 
            size={16} 
            color="white" 
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>
            {isRequesting ? t('locationRequired.requesting') : t('locationRequired.allowLocation')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${primaryColor}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: secondaryTextColor,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 24,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationRequiredState;
