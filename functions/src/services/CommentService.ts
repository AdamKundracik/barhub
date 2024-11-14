import * as admin from 'firebase-admin';
import functions from 'firebase-functions';
import {
  AddedCommentResponse,
  PostComment,
  PostCommentsResponse,
} from '../../../common/types/commentTypes';
import { PostCommentDocument } from '../documentTypes/Comment';
import { UserDocument } from '../documentTypes/User';

class CommentService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Adds a new comment to a specified post.
   *
   * @param postId - The ID of the post to which the comment will be added.
   * @param userId - The ID of the user adding the comment.
   * @param commentText - The content of the comment.
   * @returns An object containing the addedComment (with generated ID and creationTime)
   * @throws HttpsError - Throws an error if any required field is missing or if there is an error adding the comment.
   */
  async addComment(
    postId: string,
    userId: string,
    commentText: string
  ): Promise<AddedCommentResponse> {
    if (!postId || !userId || !commentText) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing postId, userId, userName, or commentText'
      );
    }

    try {
      const comment: PostCommentDocument = {
        userId: userId,
        text: commentText,
        creationTime: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add comment to DB and get the object representing added comment with generated ID etc... adn convert it to Document
      const addedCommentReference = await this.db
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .add(comment);

      const addedCommentSnapshot = await addedCommentReference.get();
      const addedCommentDocument =
        addedCommentSnapshot.data() as PostCommentDocument;

      // Create response object containing all necessary data for FE
      const addedComment: PostComment = {
        id: addedCommentSnapshot.id,
        userId: addedCommentDocument.userId,
        userName: '', // This will be added on FE
        userPhotoUrl: '', // This will be added on FE
        text: addedCommentDocument.text,
        creationTime: addedCommentDocument.creationTime,
      };

      return { addedComment: addedComment };
    } catch (error) {
      console.error('Error adding comment: ', error);
      throw new functions.https.HttpsError(
        'internal',
        `Error adding comment: ${error.message || 'An unknown error occurred'}`
      );
    }
  }

  /**
   * Retrieves comments for a specified post.
   *
   * @param postId - The ID of the post for which comments will be fetched.
   * @returns An object containing an array of comments.
   * @throws HttpsError - Throws an error if the postId is missing or if there is an error fetching comments.
   */
  public async getPostComments(postId: string): Promise<PostCommentsResponse> {
    if (!postId)
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing postId'
      );

    try {
      const postCommentsSnapshot = await this.db
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .orderBy('creationTime', 'asc')
        .get();

      // Extract comments as Documents
      const postCommentsDocuments: PostCommentDocument[] =
        postCommentsSnapshot.docs.map(doc => ({
          id: doc.id,
          userId: doc.data().userId,
          text: doc.data().text,
          creationTime: doc.data().creationTime,
        }));

      // Extract user IDs from comments
      const userIds = postCommentsDocuments.map(comment => comment.userId);
      const uniqueUserIds = [...new Set(userIds)];

      // Fetch all users in a single query (optimization)
      const usersSnapshot = await this.db
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', uniqueUserIds)
        .get();

      const usersMap = new Map<string, UserDocument>();
      usersSnapshot.docs.forEach(userDoc => {
        usersMap.set(userDoc.id, userDoc.data() as UserDocument);
      });

      // Create response object containing all necessary data for FE (combining comments Docs with the associated user data)
      const postComments: PostComment[] = postCommentsDocuments.map(
        comment => ({
          id: comment.id,
          userId: comment.userId,
          userName: usersMap.get(comment.userId)?.userName || 'Deleted User', // Fallback for missing user data
          userPhotoUrl: usersMap.get(comment.userId)?.userPhotoUrl || '',
          text: comment.text,
          creationTime: comment.creationTime,
        })
      );

      return { comments: postComments };
    } catch (error) {
      console.error('Error fetching comments: ', error);

      throw new functions.https.HttpsError(
        'internal',
        `Error fetching comments: ${error}`
      );
    }
  }
}

export default CommentService;
