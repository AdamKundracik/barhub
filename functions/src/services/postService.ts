import * as admin from 'firebase-admin';
import functions from 'firebase-functions';
import { Post } from '../../../common/types/commentTypes';
import { PostDocument } from '../documentTypes/Post';

export interface SavePostResponse {
  post: Post;
}

class PostService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Adds a new comment to a specified post.
   *
   * @param userId - The ID of the user adding the comment.
   * @param post - Post object with mandatory data
   * @returns An object containing the addedComment (with generated ID and creationTime)
   * @throws HttpsError - Throws an error if any required field is missing or if there is an error adding the comment.
   */
  async savePost(userId: string, post: Post): Promise<SavePostResponse> {
    if (!userId || !post) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing postId, userId, userName, or commentText'
      );
    }

    try {
      const fileId = `${new Date().getTime()}_${userId}`;

      const postDoc: PostDocument = {
        ...post,
        userId: userId ?? '',
        fileId: fileId ?? '',
        creationTime: new Date().toISOString(),
        timestamp: Date.now(),
      };

      // Add post to DB and get the object representing added post with generated ID etc... adn convert it to Document
      const addedPostReference = await this.db.collection('posts').add(postDoc);

      const addedPostSnapshot = await addedPostReference.get();
      const addedPostDocument = addedPostSnapshot.data() as PostDocument;

      // Create response object containing all necessary data for FE

      return { post: { ...addedPostDocument, id: addedPostReference.id } };
    } catch (error) {
      console.error('Error adding post: ', error);
      throw new functions.https.HttpsError(
        'internal',
        `Error adding post: ${error.message || 'An unknown error occurred'}`
      );
    }
  }
}

export default PostService;
