import {
  GetFreshnessContentResult,
  ServiceCodeEnum,
  ServiceStatusEnum,
} from '../types/functions-types';
import { GeoPointType } from '../types/types';
import { Post } from '@/shared';
import { authService } from '../../services/authService';
import { API_CONFIG, ENDPOINTS } from '../../config/api';
import { mapBackendPostsToFrontend } from '../mappers/postMapper';

class PostService {
  public savePost = async (post: Omit<Post, 'creationTime'>) => {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.POSTS.BASE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(post),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save post');
      }

      const data = await response.json();
      return data; // Backend returns the saved post with ID
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  };

  public deletePost = async (postId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.POSTS.BY_ID(postId)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete post');
      }

      // Backend returns 204 No Content (empty response)
      if (response.status === 204) {
        return { success: true, message: 'Post deleted successfully' };
      }

      // Fallback: try to parse JSON if response has content
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting post:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete post'
      };
    }
  };
}

export const getFreshContent = async (
  geoPoint: GeoPointType,
  radius: number,
  cursor?: string,
  userId?: number
): Promise<GetFreshnessContentResult> => {
  try {
    // Convert radius from meters to kilometers
    const radiusKm = radius;

    const requestBody = {
      latitude: geoPoint._lat,
      longitude: geoPoint._long,
      radiusKm: radiusKm,
      cursor: cursor || null,
      pageSize: 5,
      userId: userId || null,
    };

    const response = await authService.makeAuthenticatedRequest(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.POSTS.FRESH_CONTENT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch fresh content');
    }

    const data = await response.json();
    // Map backend posts to frontend format
    const mappedPosts = mapBackendPostsToFrontend(data.posts || []);

    // Convert backend response to expected format
    return {
      status: ServiceStatusEnum.SUCCESS,
      code: ServiceCodeEnum.SUCCESS,
      data: {
        posts: mappedPosts,
        lastVisible: data.nextCursor || null,
      },
    };
  } catch (error) {
    console.error('Error fetching fresh content:', error);
    return {
      status: ServiceStatusEnum.ERROR,
      code: ServiceCodeEnum.BAD_REQUEST,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getPostsByPlaceId = async (
  placeId: string,
  cursor?: string,
  userId?: number
): Promise<GetFreshnessContentResult> => {
  try {
    const requestBody = {
      placeId: placeId,
      cursor: cursor || null,
      pageSize: 5,
      userId: userId || null,
    };

    const response = await authService.makeAuthenticatedRequest(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.POSTS.BY_PLACE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch posts by place');
    }

    const data = await response.json();
    // Map backend posts to frontend format
    const mappedPosts = mapBackendPostsToFrontend(data.posts || []);

    // Convert backend response to expected format
    return {
      status: ServiceStatusEnum.SUCCESS,
      code: ServiceCodeEnum.SUCCESS,
      data: {
        posts: mappedPosts,
        lastVisible: data.nextCursor || null,
      },
    };
  } catch (error) {
    console.error('[getPostsByPlaceId] Error fetching posts by place:', error);
    return {
      status: ServiceStatusEnum.ERROR,
      code: ServiceCodeEnum.BAD_REQUEST,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const postService = new PostService();
export default postService;
