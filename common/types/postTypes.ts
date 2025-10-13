/**
 * Frontend Post interface mapped from backend PostDTO
 * 
 * Backend PostDTO structure:
 * - id: Long
 * - createdAt, updatedAt: LocalDateTime
 * - occupancy: OccupancyTypeEnum
 * - userId: String
 * - placeId: String
 * - isHighlighted: boolean
 * - liked: boolean (if current user liked)
 * - likesCount: int
 * - metadata: PostMetadataDTO
 * - user: PostAuthorDTO
 */
export interface Post {
  // From AbstractEntityDTO
  id: string; // Long converted to string
  
  // From PostDTO
  userId: string;
  folderId: string; // Maps to placeId from backend
  occupancy: string;
  photoUrl: string; // From metadata
  fileId: string; // From metadata
  
  // From PostMetadataDTO
  location: {
    _lat: number; // Parsed from metadata.locationLat
    _long: number; // Parsed from metadata.locationLong
  };
  placeTypes: string[]; // From metadata.placeTypes
  placeName: string; // From metadata
  placeAddress: string; // From metadata
  
  // Timestamps (from AbstractAuditableEntityDTO)
  creationTime: Date; // Mapped from createdAt (LocalDateTime)
  timestamp: number; // Milliseconds timestamp
  
  // Engagement
  likesCount: number; // From PostDTO
  commentsCount?: number; // Optional, not in PostDTO yet
  isLiked: boolean; // Maps to 'liked' from PostDTO
  
  // Permissions (from PostDTO)
  canDelete: boolean; // Current user can delete this post
  canReport: boolean; // Current user can report this post
  canHighlight: boolean; // Current user can highlight this post
  isHighlighted: boolean; // Post is currently highlighted (pinned)
  
  // User info (PostAuthorDTO: id, name, photoUrl)
  user?: {
    id: string;
    displayName: string; // Maps to 'name' from PostAuthorDTO
    photoUrl: string;
    expoPushToken?: string; // Optional, for notifications
  };
  
  // Legacy/Frontend-only fields
  geohash: string; // Not stored in backend, used for frontend geolocation
}

export type InfinityScrollPost = {
  posts: Post[];
  lastVisible: string;
};
