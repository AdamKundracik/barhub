import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import { SavePostResponse } from '../../../../functions/src/services/postService';
import { Post } from '../../../../shared';

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

const postService = new PostService();
export default postService;
