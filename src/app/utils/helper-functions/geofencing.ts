import { LocationType } from '../types/types';

/**
 * Geofencing configuration
 * Maximum distance user can move map from their current location
 */
export const GEOFENCE_CONFIG = {
  // Maximum radius in kilometers from user's current location
  maxRadiusKm: 30,
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if target location is within allowed perimeter from user's current location
 * @param targetLocation Location to check (e.g., map center)
 * @param userLocation User's current GPS location
 * @returns true if target location is within allowed distance from user location
 */
export function isLocationWithinPerimeter(
  targetLocation: LocationType | null,
  userLocation: LocationType | null
): boolean {
  if (!targetLocation || !userLocation) {
    return false;
  }

  const distance = calculateDistance(
    targetLocation.latitude,
    targetLocation.longitude,
    userLocation.latitude,
    userLocation.longitude
  );

  return distance <= GEOFENCE_CONFIG.maxRadiusKm;
}
