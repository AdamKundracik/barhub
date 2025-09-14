import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import { SavePostResponse } from '../../../../functions/src/services/postService';
import { Post } from '../../../../shared';
import { GetFreshnessContentResult } from '../types/functions-types';
import { GeoPointType } from '../types/types';

class PostService {
  public savePost = async (post: Omit<Post, 'creationTime'>) => {
    const cloudFunction = httpsCallable(functions, 'savePost');
    const response = await cloudFunction({
      post,
    });
    const data = response.data as SavePostResponse;
    return data.post;
  };
}

export const getFreshContent = async (
  geoPoint: GeoPointType,
  radius: number,
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable(functions, 'getFreshContent');
  const response = (await cloudFunction({
    geoPoint,
    radius,
    pageSize: 10,
    lastVisible: lastVisible,
  })) as unknown as GetFreshnessContentResult;
  return response;
};

export const getPostsByPlaceId = async (
  placeId: string,
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable(functions, 'getPostsByPlaceId');
  const response = (await cloudFunction({
    placeId,
    pageSize: 10,
    lastVisible: lastVisible,
  })) as unknown as GetFreshnessContentResult;
  return response;
};

const postService = new PostService();
export default postService;
