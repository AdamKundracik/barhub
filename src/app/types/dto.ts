// Backend DTO types - mirroring Java DTOs exactly

// Enums
export enum RoleEnum {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

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
  role: RoleEnum;
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
  user?: ClientDTO; // User data included in login/register response
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
  postId?: number;
  notificationType: string;
  placeId?: string; // Google Place ID (string)
  sender?: ClientDTO; // Full sender user object
  senderName: string;
  senderToken?: string;
  read: boolean;
  userId: number;
  commentText?: string;
}

export interface GetUserNotificationsResponseDTO {
  notifications: NotificationDTO[];
  hasNewNotifications: boolean;
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

// Notification DTOs
export interface RequestNotificationDTO {
  placeId: string; // Google Place ID (string)
  placeName: string;
  placeLocation: {
    latitude: number;
    longitude: number;
  };
  senderToken: string;
  senderId: number;
}

export interface ResponseNotificationDTO {
  placeId: string; // Google Place ID (string)
  senderToken: string;
  postId: number;
  userId: number;
}

export interface LikeNotificationDTO {
  postAuthorId: number;
  senderId: number;
  senderName: string;
  postId: number;
}

export interface CommentNotificationDTO {
  postAuthorId: number;
  senderId: number;
  senderName: string;
  postId: number;
  commentText: string;
}

// Like DTOs
export interface LikePostRequestDTO {
  userId: number;
}

export interface LikePostResponseDTO {
  liked: boolean;
  totalLikes: number;
  message: string;
}
