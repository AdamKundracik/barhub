/**
 * Image Cache Utilities
 *
 * Provides cache busting functionality for profile images to ensure
 * updated images are displayed immediately when the same filename is used.
 */

// Global cache buster store
let globalCacheBuster = Date.now();

/**
 * Updates the global cache buster timestamp.
 * Call this when a profile photo is updated to force all components to reload images.
 */
export const updateImageCacheBuster = (): number => {
  globalCacheBuster = Date.now();
  return globalCacheBuster;
};

/**
 * Gets the current cache buster timestamp.
 */
export const getImageCacheBuster = (): number => {
  return globalCacheBuster;
};

/**
 * Adds cache busting parameter to an image URL.
 * @param url - The original image URL
 * @param userId - Optional user ID for additional uniqueness
 * @returns URL with cache busting parameter
 */
export const addCacheBuster = (url: string, userId?: string | null): string => {
  if (!url) return url;

  const separator = url.includes('?') ? '&' : '?';
  const userParam = userId ? `&uid=${userId}` : '';
  return `${url}${separator}cb=${globalCacheBuster}${userParam}`;
};

/**
 * Creates a unique key for React components to force re-render when image changes.
 * @param componentName - Name of the component (for debugging)
 * @param userId - User ID
 * @param photoUrl - Photo URL
 * @returns Unique key string
 */
export const createImageKey = (
  componentName: string,
  userId: string | null | undefined,
  photoUrl: string | undefined
): string => {
  return `${componentName}-avatar-${userId}-${photoUrl}-${globalCacheBuster}`;
};

