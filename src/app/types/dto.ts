// Backend DTO types - mirroring Java DTOs exactly

// Base types
export interface AbstractEntityDTO {
  id: number;
}

export interface AbstractAuditableEntityDTO extends AbstractEntityDTO {
  createdAt: string; // ISO string format: "yyyy-MM-dd HH:mm:ss[.SSSSSS]"
  updatedAt: string; // ISO string format: "yyyy-MM-dd HH:mm:ss[.SSSSSS]"
}

// Search History
export interface SearchHistoryItemEmbeddable {
  mainText: string;
  secondaryText: string;
  placeId: string;
}

// Client/User DTOs
export interface ClientDTO extends AbstractAuditableEntityDTO {
  dateOfBirth: string; // ISO string format
  disabled: boolean;
  name: string;
  email: string;
  emailVerified: boolean;
  usingFakeLocation: boolean;
  lastUploadedPostAt: string; // ISO string format
  lastCheckedNotifications: string; // ISO string format
  photoUrl?: string;
  premium: boolean;
  pushTokens: string[];
  searchHistory: SearchHistoryItemEmbeddable[];
}

export interface CreateClientRequestDTO {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  photoUrl?: string;
}

export interface PushTokenRequestDTO {
  token: string;
}

export interface UploadCheckResponseDTO {
  canUpload: boolean;
  remainingSeconds?: number;
}

export interface UploadLocationRequestDTO {
  latitude: number;
  longitude: number;
}

export interface GeohashFilterRequestDTO {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

// Auth DTOs
export interface SignInRequestDTO {
  email: string;
  password: string;
}

export interface SignUpRequestDTO {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  photoUrl?: string;
}

export interface JwtAuthenticationResponseDTO {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

// Post DTOs
export enum OccupancyTypeEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  FULL = 'FULL'
}

export interface PostMetadataDTO {
  placeTypes: string[];
  placeName: string;
  placeAddress: string;
  photoUrl: string;
  locationLat: string;
  locationLong: string;
}

export interface PostDTO extends AbstractAuditableEntityDTO {
  occupancy: OccupancyTypeEnum;
  userId: string;
  placeId: string;
  isHighlighted: boolean;
  liked: boolean; // indicates if current user has liked this post
  likesCount: number; // total number of likes for this post
  metadata: PostMetadataDTO;
}

export interface FreshContentRequestDTO {
  latitude: number;
  longitude: number;
  radiusKm: number;
  limit?: number;
}

export interface PostsByPlaceRequestDTO {
  placeId: string;
  limit?: number;
}

export interface LikePostRequestDTO {
  userId: string;
}

export interface LikePostResponseDTO {
  success: boolean;
  likesCount: number;
  isLiked: boolean;
}

export interface PaginatedPostsResponseDTO {
  posts: PostDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreatePostRequestDTO {
  occupancy: OccupancyTypeEnum;
  placeId: string;
  metadata: PostMetadataDTO;
}

// Notification DTOs
export interface NotificationDTO extends AbstractAuditableEntityDTO {
  type: string;
  message: string;
  read: boolean;
  userId: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface GetUserNotificationsResponseDTO {
  notifications: NotificationDTO[];
  newNotificationsCount: number;
}

// Leaderboard DTOs
export interface LeaderboardDTO extends AbstractAuditableEntityDTO {
  points: number;
  client: ClientDTO;
  type: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export interface LeaderboardResponseDTO {
  top100: LeaderboardDTO[];
  currentUser: LeaderboardDTO | null;
  currentUserInTop100: boolean;
}

export interface CommentRequestDTO {
  postId: string;
  content: string;
  userId: string;
}

export interface CommentResponseDTO extends AbstractAuditableEntityDTO {
  content: string;
  userId: string;
  postId: string;
  userDisplayName: string;
  userPhotoUrl?: string;
}

// Leaderboard DTOs
export interface LeaderboardDTO extends AbstractAuditableEntityDTO {
  userId: string;
  points: number;
  rank: number;
  userDisplayName: string;
  userPhotoUrl?: string;
}

// Report DTOs
export interface ReportDTO extends AbstractAuditableEntityDTO {
  reportedEntityId: string;
  reportedEntityType: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: string;
}

// Utility types for API responses
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

// Helper type for converting dates
export type DateString = string; // ISO format: "yyyy-MM-dd HH:mm:ss[.SSSSSS]"
