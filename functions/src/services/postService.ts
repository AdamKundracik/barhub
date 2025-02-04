import * as admin from 'firebase-admin';
import functions, { https, logger } from 'firebase-functions';
import { InfinityScrollPost, Post } from '../../../common/types/postTypes';
import { GeoPointType, PostDocument } from '../documentTypes/Post';
import * as geofire from 'geofire-common';

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
        creationTime: admin.firestore.Timestamp.now(),
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

      // First get all documents
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

      // Get the initial documents
      const querySnapshot = await query.get();
      // logger.debug('Total documents found:', querySnapshot.size);

      // Filter documents by distance
      const matchingDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

      for (const doc of querySnapshot.docs) {
        try {
          const data = doc.data();
          logger.debug('Document data:', {
            id: doc.id,
            location: data.location,
            geohash: data.geohash,
          });

          // Validate location data
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
          continue;
        }
      }

      if (matchingDocs.length === 0) {
        logger.info('No documents found within radius');
        return { posts: [], lastVisible: '' };
      }

      // Already sorted by timestamp due to the initial query
      const paginatedDocs = matchingDocs.slice(0, pageSize);

      // Get additional data for matching docs
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
      // First get posts filtered by placeId
      let query = this.db
        .collection('posts')
        .where('folderId', '==', placeId)
        .orderBy('timestamp', 'desc');

      // Handle pagination if last visible document is provided
      if (lastVisible) {
        const lastVisibleDoc = await this.db
          .collection('posts')
          .doc(lastVisible)
          .get();

        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        }
      }

      // Execute the query
      const querySnapshot = await query.limit(pageSize).get();

      // If no documents found
      if (querySnapshot.empty) {
        return { posts: [], lastVisible: '' };
      }

      // Process each document to get full post details
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
}

export default PostService;
