import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import { SavePostResponse } from '../../../../functions/src/services/postService';
import { Post } from '../../../../shared';
import { GetFreshnessContentResult } from '../helper-functions/functions-types';

class PostService {
  public savePost = async (post: Post) => {
    const cloudFunction = httpsCallable(functions, 'savePost');
    const response = await cloudFunction({
      post,
    });
    const data = response.data as SavePostResponse;
    return data.post;
  };
}

export const getFreshContent = async (
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable(functions, 'getFreshContent');
  const response = (await cloudFunction({
    pageSize: 10,
    lastVisible: lastVisible,
  })) as unknown as GetFreshnessContentResult;
  return response;
};

const postService = new PostService();
export default postService;
