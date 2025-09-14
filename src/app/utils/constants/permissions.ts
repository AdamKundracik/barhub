import { Platform } from 'react-native';
import { Icons } from '../icons/icons';
import { PermissionType } from '../hooks/usePermissions';

export interface PermissionConfig {
  key: PermissionType;
  icon: any;
  gradient: string[];
  titleKey: string;
  descriptionKey: string;
  required: boolean;
}

export const PERMISSION_CONFIGS: PermissionConfig[] = [
  {
    key: 'geolocation',
    icon: Icons.Location,
    gradient: ['#087A72', '#14252A'],
    titleKey: 'permissions.location',
    descriptionKey: 'permissions.locationDesc',
    required: Platform.OS !== 'web',
  },
  {
    key: 'camera',
    icon: Icons.Camera,
    gradient: ['#010A0D', '#065C55'],
    titleKey: 'permissions.camera',
    descriptionKey: 'permissions.cameraDesc',
    required: true,
  },
  {
    key: 'notification',
    icon: Icons.Bell,
    gradient: ['#14252A', '#065C55'],
    titleKey: 'permissions.notification',
    descriptionKey: 'permissions.notificationDesc',
    required: true,
  },
  {
    key: 'tracking',
    icon: Icons.Tracking,
    gradient: ['#065C55', '#5A6A6A'],
    titleKey: 'permissions.tracking',
    descriptionKey: 'permissions.trackingDesc',
    required: Platform.OS === 'ios',
  },
];

export const getRequiredPermissions = () =>
  PERMISSION_CONFIGS.filter(config => config.required);
