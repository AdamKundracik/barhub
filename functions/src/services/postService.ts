import * as admin from 'firebase-admin';
import { https, logger } from 'firebase-functions';
import { InfinityScrollPost, Post } from '../../../common/types/postTypes';
import { GeoPointType, PostDocument } from '../documentTypes/Post';
import * as geofire from 'geofire-common';
import { HttpsError } from 'firebase-functions/https';

type SavePostResponse = {
  post: Post;
};
export interface DeletePostResponse {
  success: boolean;
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
      throw new HttpsError(
        'invalid-argument',
        'Missing postId, userId, userName, or commentText'
      );
    }

    try {
      const timestamp = admin.firestore.Timestamp.now();
      const fileId = `${post.fileId}_${userId}`;

      const postDoc: PostDocument = {
        ...post,
        userId: userId ?? '',
        fileId: fileId ?? '',
        creationTime: timestamp,
      };

      const addedPostReference = await this.db.collection('posts').add(postDoc);

      const addedPostSnapshot = await addedPostReference.get();
      const addedPostDocument = addedPostSnapshot.data() as PostDocument;

      return { post: { ...addedPostDocument, id: addedPostReference.id } };
    } catch (error) {
      console.error('Error adding post: ', error);
      throw new HttpsError(
        'internal',
        `Error adding post: ${error.message || 'An unknown error occurred'}`
      );
    }
  }

  /**
   * Retrieves fresh content for infinite scrolling with pagination.
   *
   * @param geoPoint - User location as [number, number] type
   * @param radius - Radius to filter posts (in km)
   * @param uid - User ID of the authenticated user.
   * @param pageSize - Number of posts to retrieve per page.
   * @param lastVisible - ID of the last post from the previous query.
   * @returns An object containing the posts and the last visible document ID.
   */
  async getFreshContent(
    geoPoint: GeoPointType,
    radius: number,
    uid: string,
    pageSize: number = 3,
    lastVisible: string | null = null
  ): Promise<InfinityScrollPost> {
    try {
      const center: [number, number] = [geoPoint._lat, geoPoint._long];
      const radiusInM = radius * 1000;

      let query = this.db
        .collection('posts')
        .orderBy('creationTime', 'desc')
        .orderBy('geohash');

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

      const matchingDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

      for (const doc of querySnapshot.docs) {
        try {
          const data = doc.data();
          logger.debug('Document data:', {
            id: doc.id,
            location: data.location,
            geohash: data.geohash,
          });

          if (
            !data.location ||
            typeof data.location._lat !== 'number' ||
            typeof data.location._long !== 'number'
          ) {
            logger.warn('Invalid location data for document:', doc.id);
            continue;
          }

          const lat = Number(data.location._lat);
          const lng = Number(data.location._long);

          const distanceInKm = geofire.distanceBetween(
            [lat, lng] as [number, number],
            center
          );
          const distanceInM = distanceInKm * 1000;

          if (distanceInM <= radiusInM) {
            matchingDocs.push(doc);
          }
        } catch (docError) {
          logger.warn('Error processing document:', {
            id: doc.id,
            error: docError.message,
          });
        }
      }

      if (matchingDocs.length === 0) {
        logger.info('No documents found within radius');
        return { posts: [], lastVisible: '' };
      }

      const paginatedDocs = matchingDocs.slice(0, pageSize);

      const posts = await Promise.all(
        paginatedDocs.map(async doc => {
          const postData = doc.data() as Post;

          const [likesSnapshot, commentsSnapshot, likeSnapshot, userSnapshot] =
            await Promise.all([
              this.db.collection('posts').doc(doc.id).collection('likes').get(),
              this.db
                .collection('posts')
                .doc(doc.id)
                .collection('comments')
                .get(),
              this.db
                .collection('posts')
                .doc(doc.id)
                .collection('likes')
                .doc(uid)
                .get(),
              this.db.collection('users').doc(postData.userId).get(),
            ]);

          const user = userSnapshot.exists
            ? {
                id: userSnapshot.id,
                displayName: userSnapshot.data()?.displayName || 'Missing name',
                photoUrl: userSnapshot.data()?.photoURL || '',
                expoPushToken: userSnapshot.data()?.pushToken ?? '',
              }
            : {
                id: '',
                displayName: 'Deleted user',
                photoUrl: '',
                expoPushToken: '',
              };

          return {
            ...postData,
            id: doc.id,
            isLiked: likeSnapshot.exists,
            likesCount: likesSnapshot.size,
            commentsCount: commentsSnapshot.size,
            user: user,
          };
        })
      );

      logger.debug('posts', posts.length);
      return {
        posts,
        lastVisible:
          paginatedDocs.length > 0
            ? paginatedDocs[paginatedDocs.length - 1].id
            : '',
      };
    } catch (error) {
      logger.error('Error fetching fresh content:', error);
      throw new https.HttpsError(
        'internal',
        `Error fetching fresh content: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieves posts for a specific place with pagination.
   *
   * @param uid - User ID of the authenticated user.
   * @param placeId - ID of the place to filter posts.
   * @param pageSize - Number of posts to retrieve per page.
   * @param lastVisible - ID of the last post from the previous query.
   * @returns An object containing the posts and the last visible document ID.
   */
  async getPostsByPlaceId(
    uid: string,
    placeId: string,
    pageSize: number = 3,
    lastVisible: string | null = null
  ): Promise<InfinityScrollPost> {
    try {
      let query = this.db
        .collection('posts')
        .where('folderId', '==', placeId)
        .orderBy('timestamp', 'desc');

      if (lastVisible) {
        const lastVisibleDoc = await this.db
          .collection('posts')
          .doc(lastVisible)
          .get();

        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        }
      }

      const querySnapshot = await query.limit(pageSize).get();

      if (querySnapshot.empty) {
        return { posts: [], lastVisible: '' };
      }

      const posts = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const postData = doc.data() as Post;

          const [likesSnapshot, commentsSnapshot, likeSnapshot, userSnapshot] =
            await Promise.all([
              this.db.collection('posts').doc(doc.id).collection('likes').get(),
              this.db
                .collection('posts')
                .doc(doc.id)
                .collection('comments')
                .get(),
              this.db
                .collection('posts')
                .doc(doc.id)
                .collection('likes')
                .doc(uid)
                .get(),
              this.db.collection('users').doc(postData.userId).get(),
            ]);

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
            likesCount: likesSnapshot.size,
            commentsCount: commentsSnapshot.size,
            user: user,
          };
        })
      );

      return {
        posts,
        lastVisible:
          querySnapshot.docs.length > 0
            ? querySnapshot.docs[querySnapshot.docs.length - 1].id
            : '',
      };
    } catch (error) {
      logger.error('Error fetching posts by place ID:', error);
      throw new https.HttpsError(
        'internal',
        `Error fetching posts by place ID: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a post by its ID, including its subcollections (likes, comments).
   *
   * @param postId - ID of the post to delete
   * @returns A success message when deleted
   * @throws HttpsError if the post does not exist or deletion fails
   */
  async deletePost(postId: string): Promise<{ success: boolean }> {
    if (!postId) {
      throw new HttpsError('invalid-argument', 'Missing postId');
    }

    try {
      const postRef = this.db.collection('posts').doc(postId);
      const postSnap = await postRef.get();

      if (!postSnap.exists) {
        throw new HttpsError('not-found', `Post with ID ${postId} not found`);
      }

      // batch delete subcollections (likes, comments)
      const [likesSnap, commentsSnap] = await Promise.all([
        postRef.collection('likes').get(),
        postRef.collection('comments').get(),
      ]);

      const batch = this.db.batch();

      likesSnap.forEach(doc => batch.delete(doc.ref));
      commentsSnap.forEach(doc => batch.delete(doc.ref));

      // delete main post
      batch.delete(postRef);

      await batch.commit();

      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting post:', error);
      throw new HttpsError(
        'internal',
        `Error deleting post: ${error.message || 'Unknown error'}`
      );
    }
  }
}

export default PostService;
