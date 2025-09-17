import { httpsCallable } from 'firebase/functions';
import { GetFreshnessContentResult } from '../types/functions-types';
import { GeoPointType } from '../types/types';
import {
  DeletePostResponse,
  SavePostResponse,
} from '@/functions/src/services/postService';
import { Post } from '@/shared';
import { functions } from '@/firebaseConfig';

class PostService {
  public savePost = async (post: Omit<Post, 'creationTime'>) => {
    const cloudFunction = httpsCallable(functions, 'savePost');
    const response = await cloudFunction({
      post,
    });
    const data = response.data as SavePostResponse;
    return data.post;
  };

  public deletePost = async (postId: string): Promise<DeletePostResponse> => {
    try {
      const cloudFunction = httpsCallable<
        { postId: string },
        DeletePostResponse
      >(functions, 'deletePostSecondGen');

      const response = await cloudFunction({ postId });
      console.log('delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error calling deletePost:', error);
      throw error;
    }
  };
}

export const getFreshContent = async (
  geoPoint: GeoPointType,
  radius: number,
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable(functions, 'getFreshContentSecondGen');
  const response = (await cloudFunction({
    geoPoint,
    radius,
    pageSize: 10,
    lastVisible: lastVisible,
  })) as unknown as GetFreshnessContentResult;
  console.log('resp', response);
  return response;
};

export const getPostsByPlaceId = async (
  placeId: string,
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable(functions, 'getPostsByPlaceIdSecondGen');
  const response = (await cloudFunction({
    placeId,
    pageSize: 10,
    lastVisible: lastVisible,
  })) as unknown as GetFreshnessContentResult;
  return response;
};

const postService = new PostService();
export default postService;
