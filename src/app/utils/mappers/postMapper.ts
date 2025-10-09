import { Post } from '@/common/types/postTypes';

/**
 * Maps backend PostDTO to frontend Post format
 * 
 * Backend structure:
 * {
 *   id: Long,
 *   userId: String,
 *   placeId: String,
 *   occupancy: OccupancyTypeEnum,
 *   isHighlighted: boolean,
 *   liked: boolean,
 *   likesCount: int,
 *   createdAt: LocalDateTime (string "yyyy-MM-dd HH:mm:ss.SSSSSS"),
 *   updatedAt: LocalDateTime,
 *   metadata: {
 *     placeTypes: List<String>,
 *     placeName: String,
 *     placeAddress: String,
 *     photoUrl: String,
 *     fileId: String,
 *     locationLat: String,
 *     locationLong: String
 *   },
 *   user: {
 *     id: Long,
 *     name: String,
 *     photoUrl: String
 *   }
 * }
 */
export const mapBackendPostToFrontend = (backendPost: any): Post => {
  // Extract metadata
  const metadata = backendPost.metadata || {};
  
  // Parse location from metadata (comes as String from backend)
  const locationLat = parseFloat(metadata.locationLat || '0');
  const locationLong = parseFloat(metadata.locationLong || '0');
  
  // placeTypes come as List<String> from backend
  const placeTypes: string[] = Array.isArray(metadata.placeTypes) 
    ? metadata.placeTypes 
    : [];
  
  // Parse Date from backend (handle various LocalDateTime serialization formats)
  let createdAtDate: Date;
  let timestamp: number;
  
  if (backendPost.createdAt) {
    // If it's a number (timestamp in milliseconds)
    if (typeof backendPost.createdAt === 'number') {
      timestamp = backendPost.createdAt;
      createdAtDate = new Date(timestamp);
    } 
    // If it's a string (ISO format or LocalDateTime format "yyyy-MM-dd HH:mm:ss.SSSSSS")
    else if (typeof backendPost.createdAt === 'string') {
      // Replace space with T if needed for proper ISO format
      const isoString = backendPost.createdAt.replace(' ', 'T');
      createdAtDate = new Date(isoString);
      timestamp = createdAtDate.getTime();
    }
    // If it's an object (Java LocalDateTime can serialize as object)
    else if (typeof backendPost.createdAt === 'object') {
      // Handle { time: milliseconds } format
      if (backendPost.createdAt.time) {
        timestamp = backendPost.createdAt.time;
        createdAtDate = new Date(timestamp);
      }
      // Handle array format [year, month, day, hour, minute, second, nano]
      else if (Array.isArray(backendPost.createdAt)) {
        const [year, month, day, hour, minute, second, nano] = backendPost.createdAt;
        createdAtDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0, Math.floor((nano || 0) / 1000000));
        timestamp = createdAtDate.getTime();
      }
      // Handle object with year/month/day properties
      else if (backendPost.createdAt.year) {
        const { year, monthValue, dayOfMonth, hour, minute, second, nano } = backendPost.createdAt;
        createdAtDate = new Date(
          year, 
          (monthValue || 1) - 1, 
          dayOfMonth || 1, 
          hour || 0, 
          minute || 0, 
          second || 0, 
          Math.floor((nano || 0) / 1000000)
        );
        timestamp = createdAtDate.getTime();
      }
      else {
        // Unknown object format, fallback
        createdAtDate = new Date();
        timestamp = Date.now();
      }
    }
    else {
      // Fallback
      createdAtDate = new Date();
      timestamp = Date.now();
    }
  } else {
    // Fallback to current time if createdAt is missing
    createdAtDate = new Date();
    timestamp = Date.now();
  }
  
  // Map user info (PostAuthorDTO: id, name, photoUrl)
  const userInfo = backendPost.user ? {
    id: backendPost.user.id?.toString() || '',
    displayName: backendPost.user.name || 'Unknown',
    photoUrl: backendPost.user.photoUrl || '',
  } : undefined;
  
  return {
    id: backendPost.id.toString(),
    userId: backendPost.userId?.toString() || '',
    folderId: backendPost.placeId || '',
    geohash: '', // Backend doesn't store geohash in PostDTO
    fileId: metadata.fileId || backendPost.id.toString(),
    location: {
      _lat: locationLat,
      _long: locationLong,
    },
    placeTypes: placeTypes,
    placeName: metadata.placeName || '',
    placeAddress: metadata.placeAddress || '',
    photoUrl: metadata.photoUrl || '',
    occupancy: backendPost.occupancy || 'UNKNOWN',
    creationTime: createdAtDate, // Frontend Post type expects Date
    timestamp: timestamp,
    likesCount: backendPost.likesCount || 0,
    commentsCount: backendPost.commentsCount || 0,
    isLiked: backendPost.liked || false,
    canDelete: backendPost.canDelete || false,
    canReport: backendPost.canReport || false,
    canHighlight: backendPost.canHighlight || false,
    user: userInfo,
  };
};

/**
 * Maps array of backend posts to frontend format
 */
export const mapBackendPostsToFrontend = (backendPosts: any[]): Post[] => {
  return backendPosts.map(mapBackendPostToFrontend);
};

