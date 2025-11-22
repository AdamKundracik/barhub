import {
  GetFreshnessContentResult,
  ServiceCodeEnum,
  ServiceStatusEnum,
} from '../types/functions-types';
import { GeoPointType } from '../types/types';
import { Post } from '@/shared';
import { ENDPOINTS } from '../../config/api';
import { mapBackendPostsToFrontend } from '../mappers/postMapper';
import { axiosClient } from '../api/axiosClient';

class PostService {
  public savePost = async (post: Omit<Post, 'creationTime'>) => {
    try {
      const data = await axiosClient.post(ENDPOINTS.POSTS.BASE, post);
      return data; // Backend returns the saved post with ID
    } catch (error) {
      console.error('PostService: Error saving post:', error);
      throw error;
    }
  };

  public deletePost = async (
    postId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await axiosClient.delete(ENDPOINTS.POSTS.BY_ID(postId));
      return { success: true, message: 'Post deleted successfully' };
    } catch (error) {
      console.error('PostService: Error deleting post:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete post',
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
    const requestBody = {
      latitude: geoPoint._lat,
      longitude: geoPoint._long,
      radiusKm: radius,
      cursor: cursor || null,
      pageSize: 5,
      userId: userId || null,
    };

    const data = await axiosClient.post(ENDPOINTS.POSTS.FRESH_CONTENT, requestBody);
    
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
    console.error('PostService: Error fetching fresh content:', error);
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

    const data = await axiosClient.post(ENDPOINTS.POSTS.BY_PLACE, requestBody);
    
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
    console.error('PostService: Error fetching posts by place:', error);
    return {
      status: ServiceStatusEnum.ERROR,
      code: ServiceCodeEnum.BAD_REQUEST,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const postService = new PostService();
export default postService;
