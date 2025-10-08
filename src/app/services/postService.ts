import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  CreatePostRequestDTO,
  FreshContentRequestDTO,
  LikePostRequestDTO,
  LikePostResponseDTO,
  PaginatedPostsResponseDTO,
  PostDTO,
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

  // Get post by ID
  async getPostById(postId: string): Promise<PostDTO | null> {
    try {
      return await apiUtils.get<PostDTO>(ENDPOINTS.POSTS.BY_ID(postId));
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return null;
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
    console.log('TOGGLED');
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
}

// Export singleton instance
export const postService = new PostService();
