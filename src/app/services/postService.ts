import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  CreatePostRequestDTO,
  FreshContentRequestDTO,
  LikePostRequestDTO,
  LikePostResponseDTO,
  PaginatedPostsResponseDTO,
  PostDTO,
  PostHighlightDTO,
  PostsByPlaceRequestDTO,
} from '../types/dto';

class PostService {
  // Get fresh content posts
  async getFreshContent(request: FreshContentRequestDTO): Promise<PostDTO[]> {
    try {
      return await apiUtils.post<PostDTO[]>(
        ENDPOINTS.POSTS.FRESH_CONTENT,
        request
      );
    } catch (error) {
      console.error('Error fetching fresh content:', error);
      return [];
    }
  }

  // Get posts by place
  async getPostsByPlace(request: PostsByPlaceRequestDTO): Promise<PostDTO[]> {
    try {
      return await apiUtils.post<PostDTO[]>(ENDPOINTS.POSTS.BY_PLACE, request);
    } catch (error) {
      console.error('Error fetching posts by place:', error);
      return [];
    }
  }

  // Get single post by ID
  async getPostById(postId: string, userId?: number): Promise<any | null> {
    try {
      const url = userId
        ? `${ENDPOINTS.POSTS.BASE}/${postId}?userId=${userId}`
        : `${ENDPOINTS.POSTS.BASE}/${postId}`;
      
      const backendPost = await apiUtils.get<any>(url);
      
      // Map backend DTO to frontend Post format
      const { mapBackendPostToFrontend } = await import('../utils/mappers/postMapper');
      return mapBackendPostToFrontend(backendPost);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return null;
    }
  }

  // Get paginated posts
  async getPaginatedPosts(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedPostsResponseDTO> {
    try {
      return await apiUtils.get<PaginatedPostsResponseDTO>(
        `${ENDPOINTS.POSTS.BASE}?page=${page}&size=${size}`
      );
    } catch (error) {
      console.error('Error fetching paginated posts:', error);
      return {
        posts: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        hasNext: false,
        hasPrevious: false,
      };
    }
  }

  // Create new post
  async createPost(request: CreatePostRequestDTO): Promise<PostDTO | null> {
    try {
      return await apiUtils.post<PostDTO>(ENDPOINTS.POSTS.BASE, request);
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  // Like/unlike post
  async toggleLike(
    postId: string,
    userId: number
  ): Promise<LikePostResponseDTO | null> {
    try {
      const request: LikePostRequestDTO = { userId: userId };
      return await apiUtils.post<LikePostResponseDTO>(
        ENDPOINTS.POSTS.LIKE(postId),
        request
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      return null;
    }
  }

  // Get likes count for post
  async getLikesCount(postId: string): Promise<number> {
    try {
      const response = await apiUtils.get<{ count: number }>(
        ENDPOINTS.POSTS.LIKES_COUNT(postId)
      );
      return response.count;
    } catch (error) {
      console.error('Error fetching likes count:', error);
      return 0;
    }
  }

  // Check if user liked post
  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const response = await apiUtils.get<{ liked: boolean }>(
        `${ENDPOINTS.POSTS.BY_ID(postId)}/liked/${userId}`
      );
      return response.liked;
    } catch (error) {
      console.error('Error checking if post is liked:', error);
      return false;
    }
  }

  // Highlight/Pin post
  async highlightPost(postId: string, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const url = `${ENDPOINTS.HIGHLIGHTS.BASE}?postId=${postId}&userId=${userId}`;
      await apiUtils.post(url, {});
      return { success: true };
    } catch (error: any) {
      console.error('Error highlighting post:', error);
      return { 
        success: false, 
        message: error?.response?.data?.message || error?.message || 'Failed to highlight post' 
      };
    }
  }

  // Un-highlight/Unpin post
  async unhighlightPost(postId: string, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const url = `${ENDPOINTS.HIGHLIGHTS.BASE}?postId=${postId}&userId=${userId}`;
      await apiUtils.delete(url);
      return { success: true };
    } catch (error: any) {
      console.error('Error unhighlighting post:', error);
      return { 
        success: false, 
        message: error?.response?.data?.message || error?.message || 'Failed to unhighlight post' 
      };
    }
  }

  // Toggle highlight (convenience method)
  async toggleHighlight(postId: string, userId: number, currentlyHighlighted: boolean): Promise<{ success: boolean; isHighlighted: boolean; message?: string }> {
    const result = currentlyHighlighted 
      ? await this.unhighlightPost(postId, userId)
      : await this.highlightPost(postId, userId);
    
    return {
      ...result,
      isHighlighted: result.success ? !currentlyHighlighted : currentlyHighlighted,
    };
  }

  // Get user's active highlighted posts (within 24h)
  async getUserHighlightedPosts(userId: string): Promise<PostHighlightDTO[]> {
    try {
      const highlights = await apiUtils.get<PostHighlightDTO[]>(
        ENDPOINTS.POSTS.USER_HIGHLIGHTS_ACTIVE(userId)
      );
      return highlights;
    } catch (error) {
      console.error('Error fetching user highlights:', error);
      return [];
    }
  }

  // Delete post
  async deletePost(postId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await apiUtils.delete(ENDPOINTS.POSTS.BY_ID(postId));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to delete post'
      };
    }
  }
}

// Export singleton instance
export const postService = new PostService();
