/**
 * Frontend Comment interface mapped from backend CommentDTO
 * 
 * Backend CommentDTO structure:
 * - id: Long
 * - createdAt, updatedAt: LocalDateTime
 * - content: String
 * - postId: Long
 * - user: PostAuthorDTO (id, name, photoUrl, role)
 * - canDelete: boolean
 */
export interface PostComment {
  id: string; // Long converted to string
  content: string; // Comment text
  postId: string; // Long converted to string
  createdAt?: string; // LocalDateTime as ISO string
  updatedAt?: string; // LocalDateTime as ISO string
  user: {
    id: string; // Long converted to string
    name: string; // User display name
    photoUrl: string;
    role?: 'USER' | 'MODERATOR' | 'ADMIN';
  };
  canDelete: boolean; // Current user can delete this comment
  canReport: boolean; // Current user can report this comment
  
  // Legacy fields for backward compatibility
  userId?: string;
  userName?: string;
  userPhotoUrl?: string;
  text?: string; // Maps to content
  creationTime?: Date; // Parsed from createdAt
}

/**
 * Paginated response from backend
 */
export interface PaginatedCommentsResponse {
  comments: PostComment[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Request DTO for creating a comment
 */
export interface CreateCommentRequest {
  postId: number; // Long
  content: string; // 1-500 characters
}

/**
 * Error codes for comment operations
 */
export enum CommentErrorCode {
  COMMENT_TOO_SOON = 'COMMENT_TOO_SOON',
  COMMENT_ALREADY_REPORTED = 'COMMENT_ALREADY_REPORTED',
}

/**
 * Error response format from backend
 */
export interface ErrorResponse {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
  details?: string;
  errorCode?: string | CommentErrorCode;
  remainingSeconds?: number; // For COMMENT_TOO_SOON errors
}
