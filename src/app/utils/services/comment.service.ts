import { axiosClient } from '../api/axiosClient';
import { ENDPOINTS } from '../../config/api';
import {
  PostComment,
  PaginatedCommentsResponse,
  CreateCommentRequest,
} from '@/src/app/types/commentTypes';

/**
 * Maps backend CommentDTO to frontend PostComment format
 */
const mapBackendCommentToFrontend = (backendComment: any): PostComment => {
  // Parse createdAt date
  let createdAtDate: Date | undefined;
  if (backendComment.createdAt) {
    if (typeof backendComment.createdAt === 'string') {
      // Backend sends LocalDateTime as string: "2025-10-07T22:29:23.517475"
      let isoString = backendComment.createdAt.includes('T')
        ? backendComment.createdAt
        : backendComment.createdAt.replace(' ', 'T');
      
      // Add 'Z' suffix to indicate UTC time if not present
      if (
        !isoString.endsWith('Z') &&
        !isoString.includes('+') &&
        !isoString.includes('-', 10)
      ) {
        isoString = isoString + 'Z';
      }
      createdAtDate = new Date(isoString);
    } else if (typeof backendComment.createdAt === 'number') {
      createdAtDate = new Date(backendComment.createdAt);
    } else if (typeof backendComment.createdAt === 'object') {
      // Handle object format from backend
      if (backendComment.createdAt.time) {
        createdAtDate = new Date(backendComment.createdAt.time);
      }
    }
  }

  // Map user info (PostAuthorDTO)
  const userInfo = backendComment.user
    ? {
        id: backendComment.user.id?.toString() || '',
        name: backendComment.user.name || 'Unknown',
        photoUrl: backendComment.user.photoUrl || '',
        role: backendComment.user.role || 'USER',
      }
    : {
        id: '',
        name: 'Unknown',
        photoUrl: '',
        role: 'USER' as const,
      };

  return {
    id: backendComment.id?.toString() || '',
    content: backendComment.content || '',
    postId: backendComment.postId?.toString() || '',
    createdAt: backendComment.createdAt,
    updatedAt: backendComment.updatedAt,
    user: userInfo,
    canDelete: backendComment.canDelete || false,
    canReport: backendComment.canReport ?? true, // Default to true if not provided
    // Legacy fields for backward compatibility
    userId: userInfo.id,
    userName: userInfo.name,
    userPhotoUrl: userInfo.photoUrl,
    text: backendComment.content || '',
    creationTime: createdAtDate,
  };
};

class CommentService {
  /**
   * Create a new comment for a post
   */
  public addCommentToPost = async (
    postId: string,
    userId: string,
    commentText: string
  ): Promise<PostComment> => {
    try {
      const request: CreateCommentRequest = {
        postId: parseInt(postId, 10),
        content: commentText.trim(),
      };

      const response = await axiosClient.post<PostComment>(
        ENDPOINTS.COMMENTS.BASE,
        request
      );

      return mapBackendCommentToFrontend(response);
    } catch (error) {
      console.error('CommentService: Error adding comment:', error);
      throw error;
    }
  };

  /**
   * Get all comments for a post with pagination
   */
  public getCommentsForPost = async (
    postId: string,
    page: number = 0,
    size: number = 50
  ): Promise<PostComment[]> => {
    try {
      const response = await axiosClient.get<PaginatedCommentsResponse>(
        ENDPOINTS.COMMENTS.BY_POST(postId),
        {
          params: { page, size },
        }
      );

      return response.comments.map(mapBackendCommentToFrontend);
    } catch (error) {
      console.error('CommentService: Error fetching comments:', error);
      throw error;
    }
  };

  /**
   * Get comment count for a post
   */
  public getCommentCountForPost = async (postId: string): Promise<number> => {
    try {
      const count = await axiosClient.get<number>(
        ENDPOINTS.COMMENTS.COUNT_BY_POST(postId)
      );
      return count;
    } catch (error) {
      console.error('CommentService: Error fetching comment count:', error);
      return 0;
    }
  };

  /**
   * Delete a comment
   */
  public deleteComment = async (commentId: string): Promise<void> => {
    try {
      await axiosClient.delete(ENDPOINTS.COMMENTS.BY_ID(commentId));
    } catch (error) {
      console.error('CommentService: Error deleting comment:', error);
      throw error;
    }
  };

  /**
   * Get a specific comment by ID
   */
  public getCommentById = async (commentId: string): Promise<PostComment> => {
    try {
      const response = await axiosClient.get<PostComment>(
        ENDPOINTS.COMMENTS.BY_ID(commentId)
      );
      return mapBackendCommentToFrontend(response);
    } catch (error) {
      console.error('CommentService: Error fetching comment:', error);
      throw error;
    }
  };
}

const commentService = new CommentService();
export default commentService;
