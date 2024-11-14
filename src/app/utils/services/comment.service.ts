import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import {
  AddedCommentResponse,
  PostCommentsResponse,
} from '../../../../common/types/commentTypes';

class CommentService {
  public addCommentToPost = async (
    postId: string,
    userId: string,
    commentText: string
  ) => {
    const cloudFunction = httpsCallable(functions, 'addComment');
    const response = await cloudFunction({
      postId,
      userId,
      commentText,
    });
    const data = response.data as AddedCommentResponse;
    return data?.addedComment;
  };

  public getCommentsForPost = async (postId: string) => {
    const cloudFunction = httpsCallable(functions, 'getPostComments');
    const response = await cloudFunction({ postId });
    const data = response.data as PostCommentsResponse;
    console.log(data.comments);
    return data?.comments;
  };
}

const commentService = new CommentService();
export default commentService;
