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
import { ReportService } from './services/reportService';

import admin from 'firebase-admin';
import { CallableContext, HttpsError } from 'firebase-functions/https';
import { onSchedule } from 'firebase-functions/scheduler';

const { onRequest, onCall } = require('firebase-functions/v2/https');

admin.initializeApp();

const db = admin.firestore();
const functions = require('firebase-functions');

const postService = new PostService();
const commentService = new CommentService();
const notificationService = new NotifiationService();
const reportService = new ReportService();

exports.reportPostSecondGen = onCall(
  async (data: { postId: string; userId: string; reason: string }) => {
    try {
      return await reportService.reportPost(
        data.userId,
        data.postId,
        data.reason
      );
    } catch (error: any) {
      throw new HttpsError('internal', error.message || 'Error reporting post');
    }
  }
);

exports.createUser = functions.auth.user().onCreate(user => {
  return admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set(JSON.parse(JSON.stringify(user)), { merge: true });
});

exports.deleteUser = functions.auth.user().onDelete(user => {
  return admin.firestore().collection('users').doc(user.uid).delete();
});

exports.setUserSecondGen = onCall(
  async (user: User, context: CallableContext) => {
    await db
      .collection('users')
      .doc(context.auth.uid)
      .set(user, { merge: true });
  }
);

exports.savePostSecondGen = onCall(
  async (data, context: CallableContext): Promise<SavePostResponse> => {
    const { post } = data;
    return await postService.savePost(context.auth.uid, post);
  }
);

exports.getAllExistingUsersSecondGen = onCall(async () => {
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
    throw new HttpsError('internal', 'Unable to retrieve users');
  }
});

exports.getCurrentUserSecondGen = onCall(
  async (data, context: CallableContext) => {
    if (!context.auth) {
      throw new HttpsError(
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

exports.toggleLikeSecondGen = onCall(async data => {
  const { postId, userId } = data;

  if (!postId || !userId) {
    throw new HttpsError('invalid-argument', 'Missing postId or userId');
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

exports.testLogSecondGen = onCall(async (data, context: CallableContext) => {
  if (!context.auth) {
    throw new HttpsError(
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

    throw new HttpsError('internal', 'Unknown error occurred.');
  }
});

exports.getPostByIdSecondGen = onCall(async (data, context) => {
  const { postId } = data;

  if (!postId) {
    throw new HttpsError('invalid-argument', 'Post ID is required');
  }

  try {
    const postDoc = await admin
      .firestore()
      .collection('posts')
      .doc(postId)
      .get();

    if (!postDoc.exists) {
      throw new HttpsError('not-found', 'Post not found');
    }

    const postData = postDoc.data();

    const likesSnapshot = await admin
      .firestore()
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .get();
    const likesCount = likesSnapshot.size;

    const commentsSnapshot = await admin
      .firestore()
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .get();
    const commentsCount = commentsSnapshot.size;

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
      id: postId,
      likesCount,
      commentsCount,
      isLiked,
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    throw new HttpsError('internal', 'Error fetching post');
  }
});

exports.getFreshContentSecondGen = onCall(
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
        throw new HttpsError(
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
      throw new HttpsError(
        'internal',
        `Error in getFreshContent: ${error.message || 'Unknown error'}`
      );
    }
  }
);

exports.getPostsByPlaceIdSecondGen = onCall(
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
        throw new HttpsError(
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
      throw new HttpsError(
        'internal',
        `Error in getPostsByPlaceId: ${error.message || 'Unknown error'}`
      );
    }
  }
);

exports.saveNotificationSecondGen = onCall(
  async (data, context): Promise<SaveNotificationResponse> => {
    if (!context.auth) {
      throw new HttpsError(
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

exports.getUserNotificationsSecondGen = onCall(
  async (data, context): Promise<GetUserNotificationsResponse> => {
    if (!context.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to get notifications'
      );
    }

    const userId = context.auth.uid;
    return await notificationService.getUserNotifications(userId);
  }
);

exports.markAllNotificationsAsSeenSecondGen = onCall(
  async (
    data,
    context
  ): Promise<{
    success: boolean;
    updatedCount: number;
  }> => {
    if (!context.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to get notifications'
      );
    }

    const userId = context.auth.uid;
    return await notificationService.markAllNotificationsAsSeen(userId);
  }
);

exports.deleteNotificationSecondGen = onCall(
  async (
    data: { notificationId: string },
    context
  ): Promise<{
    success: boolean;
  }> => {
    if (!context.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to delete notifications'
      );
    }

    if (!data.notificationId) {
      throw new HttpsError('invalid-argument', 'Notification ID is required');
    }

    try {
      return await notificationService.deleteNotification(data.notificationId);
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw new HttpsError('internal', 'Failed to delete notification');
    }
  }
);

exports.addCommentSecondGen = onCall(async (data, context) => {
  const { postId, userId, commentText } = data;
  return await commentService.addComment(postId, userId, commentText);
});

exports.getPostCommentsSecondGen = onCall(
  async (data, context): Promise<{ comments: PostComment[] }> => {
    const { postId } = data;
    return await commentService.getPostComments(postId);
  }
);

// SCHEDULE FUNCTIONS

exports.deleteOldPostsAndImagesSecondGen = onSchedule(
  'every 60 minutes',
  async () => {
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

        // Delete notifications associated with the post
        const notificationsSnapshot = await db
          .collection('notifications')
          .where('postId', '==', doc.id)
          .get();

        const deleteNotificationsPromises = notificationsSnapshot.docs.map(
          notificationDoc => notificationDoc.ref.delete()
        );

        return Promise.all([
          admin.storage().bucket().file(filePath).delete(),
          deleteSubcollection(doc.ref, 'likes'),
          deleteSubcollection(doc.ref, 'comments'),
          doc.ref.delete(),
          ...deleteNotificationsPromises,
        ]).catch(error => {
          console.error(
            `Failed to delete post ${doc.id} and associated data:`,
            error
          );
          throw error;
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
  }
);

// Quick cleanup (every 15 minutes)
exports.deleteRecentExpiredRequestsSecondGen = onSchedule(
  'every 60 minutes',
  async () => {
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
  }
);

// Deep cleanup (every 6 hours)
export const deleteAllExpiredRequestsSecondGen = onSchedule(
  'every 60 minutes',
  async () => {
    const threeDaysInSeconds = 3 * 24 * 60 * 60;
    const timeThreeDaysAgo =
      admin.firestore.Timestamp.now().seconds - threeDaysInSeconds;
    const timestampThreeDaysAgo = new admin.firestore.Timestamp(
      timeThreeDaysAgo,
      0
    );

    try {
      const expiredNotificationsSnapshot = await admin
        .firestore()
        .collection('notifications')
        .where('creationTime', '<', timestampThreeDaysAgo)
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
  }
);

async function deleteSubcollection(postRef, subcollectionName) {
  const subcollectionSnapshot = await postRef
    .collection(subcollectionName)
    .get();
  const deletePromises = subcollectionSnapshot.docs.map(doc =>
    doc.ref.delete()
  );
  await Promise.all(deletePromises);
}
