import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebaseConfig';
import { GetFreshnessContentResult } from '../types/functions-types';
import { GeoPointType } from '../types/types';
import {
  DeletePostResponse,
  SavePostResponse,
} from '@/functions/src/services/postService';
import { Post } from '@/shared';
import { authService } from '../../services/authService';
import { API_CONFIG, ENDPOINTS } from '../../config/api';

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

  public deletePost = async (postId: string): Promise<DeletePostResponse> => {
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

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };
}

export const getFreshContent = async (
  geoPoint: GeoPointType,
  radius: number,
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable<any, GetFreshnessContentResult>(functions, 'getFreshContentSecondGen');
  const response = await cloudFunction({
    geoPoint,
    radius,
    pageSize: 5,
    lastVisible: lastVisible,
  });
  return response.data;
};

export const getPostsByPlaceId = async (
  placeId: string,
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable<any, GetFreshnessContentResult>(functions, 'getPostsByPlaceIdSecondGen');
  const response = await cloudFunction({
    placeId,
    pageSize: 5,
    lastVisible: lastVisible,
  });
  return response.data;
};

const postService = new PostService();
export default postService;
