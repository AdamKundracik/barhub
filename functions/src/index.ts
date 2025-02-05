import { CallableContext } from 'firebase-functions/lib/common/providers/https';
import { Post, User } from '../../shared';
import PostService, { SavePostResponse } from './services/postService';
import CommentService from './services/CommentService';
import { PostComment } from '../../common/types/commentTypes';
import { GeoPointType } from './documentTypes/Post';
import {
  GetUserNotificationsResponse,
  SaveNotificationResponse,
} from '../../common/types/notificationTypes';
import NotifiationService from './services/notifiationService';

const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const functions = require('firebase-functions');

const postService = new PostService();
const commentService = new CommentService();
const notificationService = new NotifiationService();

// TODO: FINISH FUNCTION
export const createUser = functions.auth.user().onCreate(user => {
  return admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set(JSON.parse(JSON.stringify(user)), { merge: true });
});

export const deleteUser = functions.auth.user().onDelete(user => {
  return admin.firestore().collection('users').doc(user.uid).delete();
});

export const setUser = functions.https.onCall(
  async (user: User, context: CallableContext) => {
    await db
      .collection('users')
      .doc(context.auth.uid)
      .set(user, { merge: true });
  }
);

export const savePost = functions.https.onCall(
  async (data, context: CallableContext): Promise<SavePostResponse> => {
    const { post } = data;
    const uploadedPost = await postService.savePost(context.auth.uid, post);
    return uploadedPost;
  }
);

exports.getAllExistingUsers = functions.https.onCall(async () => {
  const usersCollection = db.collection('users');
  try {
    const snapshot = await usersCollection.get();
    const users: User[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { users };
  } catch (error) {
    console.error('Error getting users collection: ', error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to retrieve users'
    );
  }
});

export const getCurrentUser = functions.https.onCall(
  async (data, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const uid = context.auth.uid;

    try {
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return console.error('USER NOT FOUND');
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting user data: ', error);
    }
  }
);

exports.toggleLike = functions.https.onCall(async data => {
  const { postId, userId } = data;

  if (!postId || !userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing postId or userId'
    );
  }

  try {
    const likeDocRef = db
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .doc(userId);
    const likeDoc = await likeDocRef.get();

    if (likeDoc.exists) {
      await likeDocRef.delete();
    } else {
      await likeDocRef.set({});
    }
  } catch (error) {
    console.error('Error toggling like: ', error);
  }
});

export const testLog = functions.https.onCall(
  async (data, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const usersCollection = db.collection('users');

    try {
      const snapshot = await usersCollection
        .where('uid', '!=', context.auth.uid)
        .get();
      const users: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { users };
    } catch (error) {
      console.error('Error getting users collection: ', error);

      throw new functions.https.HttpsError(
        'internal',
        'Unknown error occurred.'
      );
    }
  }
);

exports.getPostById = functions.https.onCall(async (data, context) => {
  const { postId } = data;

  if (!postId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Post ID is required'
    );
  }

  try {
    const postDoc = await admin
      .firestore()
      .collection('posts')
      .doc(postId)
      .get();

    if (!postDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Post not found');
    }

    const postData = postDoc.data();

    // Count the number of likes in the 'likes' subcollection
    const likesSnapshot = await admin
      .firestore()
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .get();
    const likesCount = likesSnapshot.size;

    // Count the number of comments in the 'comments' subcollection
    const commentsSnapshot = await admin
      .firestore()
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .get();
    const commentsCount = commentsSnapshot.size;

    // Check if the user liked the post (if authenticated)
    let isLiked = false;
    if (context.auth) {
      const uid = context.auth.uid;
      const likeSnapshot = await admin
        .firestore()
        .collection('posts')
        .doc(postId)
        .collection('likes')
        .doc(uid)
        .get();
      isLiked = likeSnapshot.exists;
    }

    // Return the post data along with likes and comments count, and if the user liked it
    return {
      ...postData,
      id: postId, // Add postId here
      likesCount,
      commentsCount,
      isLiked,
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    throw new functions.https.HttpsError('internal', 'Error fetching post');
  }
});

exports.getFreshContent = functions.https.onCall(
  async (
    data: {
      geoPoint: GeoPointType;
      radius: number;
      pageSize?: number;
      lastVisible?: string;
    },
    context: CallableContext
  ) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to fetch posts.'
        );
      }

      const { geoPoint, radius, pageSize = 3, lastVisible = null } = data;
      const uid = context.auth.uid;

      const result = await postService.getFreshContent(
        geoPoint,
        radius,
        uid,
        pageSize,
        lastVisible
      );
      return result;
    } catch (error) {
      functions.logger.error('Error in getFreshContent:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Error in getFreshContent: ${error.message || 'Unknown error'}`
      );
    }
  }
);

exports.getPostsByPlaceId = functions.https.onCall(
  async (
    data: {
      placeId: string;
      pageSize?: number;
      lastVisible?: string;
    },
    context: CallableContext
  ) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to fetch posts.'
        );
      }

      const { placeId, pageSize = 3, lastVisible = null } = data;
      const uid = context.auth.uid;

      const result = await postService.getPostsByPlaceId(
        uid,
        placeId,
        pageSize,
        lastVisible
      );
      return result;
    } catch (error) {
      functions.logger.error('Error in getPostsByPlaceId:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Error in getPostsByPlaceId: ${error.message || 'Unknown error'}`
      );
    }
  }
);

exports.saveNotification = functions.https.onCall(
  async (data, context): Promise<SaveNotificationResponse> => {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to save notifications'
      );
    }

    const userId = context.auth.uid;
    return await notificationService.saveNotification({
      userId,
      ...data,
    });
  }
);

exports.getUserNotifications = functions.https.onCall(
  async (data, context): Promise<GetUserNotificationsResponse> => {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to get notifications'
      );
    }

    const userId = context.auth.uid;
    return await notificationService.getUserNotifications(userId);
  }
);

exports.markAllNotificationsAsSeen = functions.https.onCall(
  async (
    data,
    context
  ): Promise<{
    success: boolean;
    updatedCount: number;
  }> => {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to get notifications'
      );
    }

    const userId = context.auth.uid;
    return await notificationService.markAllNotificationsAsSeen(userId);
  }
);

exports.deleteNotification = functions.https.onCall(
  async (
    data: { notificationId: string },
    context
  ): Promise<{
    success: boolean;
  }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to delete notifications'
      );
    }

    if (!data.notificationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Notification ID is required'
      );
    }

    try {
      return await notificationService.deleteNotification(data.notificationId);
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to delete notification'
      );
    }
  }
);

exports.addComment = functions.https.onCall(async (data, context) => {
  const { postId, userId, commentText } = data;
  return await commentService.addComment(postId, userId, commentText);
});

exports.getPostComments = functions.https.onCall(
  async (data, context): Promise<{ comments: PostComment[] }> => {
    const { postId } = data;
    return await commentService.getPostComments(postId);
  }
);

// SCHEDULE FUNCTIONS

exports.deleteOldPostsAndImages = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async context => {
    const threeDaysInSeconds = 3 * 24 * 60 * 60;
    const threeDaysAgo =
      admin.firestore.Timestamp.now().seconds - threeDaysInSeconds;
    const timestampThreeDaysAgo = new admin.firestore.Timestamp(
      threeDaysAgo,
      0
    );

    try {
      const postsSnapshot = await db
        .collection('posts')
        .where('creationTime', '<', timestampThreeDaysAgo)
        .get();

      const deleteOperations = postsSnapshot.docs.map(async doc => {
        const postData: Post = doc.data();
        const filePath = `${postData.folderId}/${postData.fileId}`;

        // Group all operations for this post
        return Promise.all([
          // Delete from Storage
          admin.storage().bucket().file(filePath).delete(),
          // Delete subcollections
          deleteSubcollection(doc.ref, 'likes'),
          deleteSubcollection(doc.ref, 'comments'),
          // Delete the post document
          doc.ref.delete(),
        ]).catch(error => {
          console.error(`Failed to delete post ${doc.id}:`, error);
          throw error; // Re-throw to be caught by the outer catch
        });
      });

      await Promise.all(deleteOperations);
      console.info(
        `Successfully deleted ${postsSnapshot.size} posts and their associated data`
      );
    } catch (error) {
      console.error('Error in deletion process:', error);
      throw error;
    }
  });

// Quick cleanup (every 15 minutes)
export const deleteRecentExpiredRequests = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context): Promise<void> => {
    const threeMinutesInSeconds = 3 * 60;
    const timeThreeMinutesAgo =
      admin.firestore.Timestamp.now().seconds - threeMinutesInSeconds;
    const timestampThreeMinutesAgo = new admin.firestore.Timestamp(
      timeThreeMinutesAgo,
      0
    );

    try {
      const expiredNotificationsSnapshot = await admin
        .firestore()
        .collection('notifications')
        .where('notificationType', '==', 'REQUEST')
        .where('creationTime', '<', timestampThreeMinutesAgo)
        .limit(1000)
        .get();

      if (expiredNotificationsSnapshot.empty) {
        console.info('No recent expired request notifications to delete');
        return;
      }

      const batchSize = 500;
      const batches: Promise<void>[][] = [];

      for (
        let i = 0;
        i < expiredNotificationsSnapshot.docs.length;
        i += batchSize
      ) {
        const batch = expiredNotificationsSnapshot.docs
          .slice(i, i + batchSize)
          .map(doc => doc.ref.delete());

        batches.push(batch);
      }

      await Promise.all(batches.flat());
      console.info(
        `Quick cleanup: Deleted ${expiredNotificationsSnapshot.size} expired request notifications`
      );
    } catch (error) {
      console.error('Error in quick cleanup of expired notifications:', error);
      throw error;
    }
  });

// Deep cleanup (every 6 hours)
export const deleteAllExpiredRequests = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context): Promise<void> => {
    const threeMinutesInSeconds = 3 * 60;
    const timeThreeMinutesAgo =
      admin.firestore.Timestamp.now().seconds - threeMinutesInSeconds;
    const timestampThreeMinutesAgo = new admin.firestore.Timestamp(
      timeThreeMinutesAgo,
      0
    );

    try {
      const expiredNotificationsSnapshot = await admin
        .firestore()
        .collection('notifications')
        .where('creationTime', '<', timestampThreeMinutesAgo)
        .get();

      if (expiredNotificationsSnapshot.empty) {
        console.info(
          'No expired request notifications to delete in deep cleanup'
        );
        return;
      }

      const batchSize = 500;
      const batches: Promise<void>[][] = [];

      for (
        let i = 0;
        i < expiredNotificationsSnapshot.docs.length;
        i += batchSize
      ) {
        const batch = expiredNotificationsSnapshot.docs
          .slice(i, i + batchSize)
          .map(doc => doc.ref.delete());

        batches.push(batch);
      }

      await Promise.all(batches.flat());
      console.info(
        `Deep cleanup: Deleted ${expiredNotificationsSnapshot.size} expired request notifications`
      );
    } catch (error) {
      console.error('Error in deep cleanup of expired notifications:', error);
      throw error;
    }
  });

async function deleteSubcollection(postRef, subcollectionName) {
  const subcollectionSnapshot = await postRef
    .collection(subcollectionName)
    .get();
  const deletePromises = subcollectionSnapshot.docs.map(doc =>
    doc.ref.delete()
  );
  await Promise.all(deletePromises);
}
