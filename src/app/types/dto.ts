// Backend DTO types - mirroring Java DTOs exactly

// Enums
export enum RoleEnum {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export enum AuthTypeEnum {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
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
  bio?: string; // User bio, max 120 characters
  premium: boolean;
  role: RoleEnum;
  authType: AuthTypeEnum;
  pushTokens: string[];
  searchHistory: SearchHistoryItemEmbeddable[];
  tutorialViewed: boolean; // Whether user has completed the tutorial
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

export interface SocialLoginRequestDTO {
  idToken: string;        // Google/Apple ID token
  provider: 'google' | 'apple';  // "google" or "apple"
  email?: string;         // User email from provider (optional for Apple)
  name: string;           // User name from provider
  photoUrl?: string;      // User photo URL (optional)
  appleUserId?: string;   // Apple User ID (required for Apple)
  consents?: AcceptConsentRequestDTO; // User consents (for new users)
}

export interface SignUpRequestDTO {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  photoUrl?: string;
  consents?: AcceptConsentRequestDTO; // User consents during registration
}

export interface UserConsentDTO {
  consentType: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES';
  currentVersion: string;
  acceptedVersion: string | null;
  accepted: boolean;
  acceptedAt: string | null;
  needsUpdate: boolean;
}

export interface ConsentStatusDTO {
  userId: number;
  consents: UserConsentDTO[];
}

export interface OutdatedConsentDTO {
  consentType: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES';
  currentVersion: string;
  userAcceptedVersion: string | null;
  needsUpdate: boolean;
}

export interface AuthConsentStatusDTO {
  consentsRequired: boolean;
  outdatedConsents: OutdatedConsentDTO[];
}

export interface JwtAuthenticationResponseDTO {
  token: string;
  refreshToken: string;
  user?: ClientDTO; // User data included in login/register response
  consentStatus?: AuthConsentStatusDTO; // Consent status included in auth response
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface ConsentItemDTO {
  consentType: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES';
  version: string;
  accepted: boolean;
}

export interface AcceptConsentRequestDTO {
  consents: ConsentItemDTO[];
}

export interface AcceptConsentsRequestDTO {
  consentTypes: ('TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES')[];
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
  highlighted?: boolean; // Backend returns "highlighted" (lowercase)
  isHighlighted?: boolean; // Frontend uses "isHighlighted" (camelCase)
  liked: boolean; // indicates if current user has liked this post
  likesCount: number; // total number of likes for this post
  metadata: PostMetadataDTO;
  canDelete?: boolean; // Current user can delete this post
  canReport?: boolean; // Current user can report this post
  canReportUser?: boolean; // Current user can report the post author
  canHighlight?: boolean; // Current user can highlight this post
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
export interface LeaderboardClientDTO {
  id: number;
  name: string;
  photoUrl?: string;
}

export interface LeaderboardDTO extends AbstractAuditableEntityDTO {
  points: number;
  client: LeaderboardClientDTO;
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

// Report DTOs
export enum ReasonTypeEnum {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  HARASSMENT = 'HARASSMENT',
  OTHER = 'OTHER',
}

export interface ReportDTO extends AbstractAuditableEntityDTO {
  userId: number;
  userName: string; // Name of user who created the report
  postId?: number; // Optional for post reports
  reportedUserId?: number; // Optional for user reports
  reportedUserName?: string; // Name of reported user (for user reports)
  reason: ReasonTypeEnum | string; // Backend may return string
  otherReasonMessage?: string;
}

export interface ReportUserDTO {
  reportedUserId: number;
  reason: ReasonTypeEnum;
  otherReasonMessage?: string;
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

// Highlight DTOs
export interface PostHighlightDTO extends AbstractAuditableEntityDTO {
  postId: number;
  userId: number;
  post?: PostDTO; // Included post details
}

// Favorite Place DTOs
export interface FavoritePlaceDTO {
  placeId: string;
  placeName: string;
  placeAddress: string;
  addedAt: string; // ISO string format
}

export interface AddFavoritePlaceRequestDTO {
  placeId: string;
  placeName: string;
  placeAddress: string;
}
