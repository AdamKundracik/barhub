import * as admin from 'firebase-admin';
import functions from 'firebase-functions';
import { InfinityScrollPost, Post } from '../../../common/types/postTypes';
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

  /**
   * Retrieves fresh content for infinite scrolling with pagination.
   *
   * @param uid - User ID of the authenticated user.
   * @param pageSize - Number of posts to retrieve per page.
   * @param lastVisible - ID of the last post from the previous query.
   * @returns An object containing the posts and the last visible document ID.
   */
  async getFreshContent(
    uid: string,
    pageSize: number = 3,
    lastVisible: string | null = null
  ): Promise<InfinityScrollPost> {
    try {
      let query = this.db
        .collection('posts')
        .orderBy('timestamp', 'desc')
        .limit(pageSize);

      if (lastVisible) {
        const lastVisibleDoc = await this.db
          .collection('posts')
          .doc(lastVisible)
          .get();

        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        }
      }

      const querySnapshot = await query.get();

      if (querySnapshot.empty) {
        return { posts: [], lastVisible: '' };
      }

      const posts: Post[] = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const postData = doc.data() as Post;

          const likesSnapshot = await this.db
            .collection('posts')
            .doc(doc.id)
            .collection('likes')
            .get();
          const likesCount = likesSnapshot.size;

          const commentsSnapshot = await this.db
            .collection('posts')
            .doc(doc.id)
            .collection('comments')
            .get();
          const commentsCount = commentsSnapshot.size;

          const likeSnapshot = await this.db
            .collection('posts')
            .doc(doc.id)
            .collection('likes')
            .doc(uid)
            .get();

          const userSnapshot = await this.db
            .collection('users')
            .doc(postData.userId)
            .get();

          const user = userSnapshot.exists
            ? {
                id: userSnapshot.id,
                displayName: userSnapshot.data()?.displayName || 'Missing name',
                photoUrl: userSnapshot.data()?.photoURL || '',
              }
            : {
                id: '',
                displayName: 'Deleted user',
                photoUrl: '',
              };

          return {
            ...postData,
            id: doc.id,
            isLiked: likeSnapshot.exists,
            likesCount,
            commentsCount,
            user: user,
          };
        })
      );

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return {
        posts: posts,
        lastVisible: lastDoc.id,
      };
    } catch (error) {
      functions.logger.error('Error fetching fresh content:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Error fetching fresh content: ${error.message || 'Unknown error'}`
      );
    }
  }
}

export default PostService;
