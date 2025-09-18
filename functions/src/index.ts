import PostService from './services/postService';
import CommentService from './services/CommentService';
import NotifiationService from './services/notifiationService';
import { ReportService } from './services/reportService';
import admin from 'firebase-admin';
import { GeoPointType } from './documentTypes/Post';

// ----------------- CALLABLE FUNCTIONS -----------------
import { onCall } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/https';
import { Post } from '../../common/types/postTypes';
import { onSchedule } from 'firebase-functions/scheduler';
import * as logger from 'firebase-functions/logger';

export interface StatusResponse {
  success: boolean;
}

admin.initializeApp();
const db = admin.firestore();
const functions = require('firebase-functions');

const postService = new PostService();
const commentService = new CommentService();
const notificationService = new NotifiationService();
const reportService = new ReportService();

// exports.createUser = functions.auth.user().onCreate(user => {
//   return admin
//     .firestore()
//     .collection('users')
//     .doc(user.uid)
//     .set(JSON.parse(JSON.stringify(user)), { merge: true });
// });
//
// exports.deleteUser = functions.auth.user().onDelete(user => {
//   return admin.firestore().collection('users').doc(user.uid).delete();
// });

type User = {
  id: string;
  [key: string]: any;
};

type SavePostResponse = {
  post: Post;
};

type ReportPostData = {
  postId: string;
  userId: string;
  reason: string;
};

export const reportPostSecondGen = onCall<ReportPostData, any>(async req => {
  const { postId, userId, reason } = req.data;

  try {
    return await reportService.reportPost(userId, postId, reason);
  } catch (error: any) {
    logger.error('Error reporting post:', error);
    throw new Error(error.message || 'Error reporting post');
  }
});

export const setUserSecondGen = onCall<{ user: User }, StatusResponse>(
  async req => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new Error('Unauthenticated: must be logged in');
    }

    const { user } = req.data;
    try {
      await db.collection('users').doc(uid).set(user, { merge: true });
      logger.info(`User ${uid} updated successfully`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to set user:', error);
      throw new Error('Failed to set user');
    }
  }
);

export const savePostSecondGen = onCall<{ post: any }, SavePostResponse>(
  async req => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new Error('Unauthenticated: must be logged in');
    }

    const { post } = req.data;
    try {
      return await postService.savePost(uid, post);
    } catch (error) {
      logger.error('Failed to save post:', error);
      throw new Error('Failed to save post');
    }
  }
);

export const deletePostSecondGen = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to delete a post.'
    );
  }

  const { postId } = request.data as { postId: string };
  if (!postId) {
    throw new HttpsError('invalid-argument', 'Missing postId');
  }

  const result = await postService.deletePost(postId);
  return result;
});

export const toggleLikeSecondGen = onCall(async request => {
  const { postId, userId } = request.data as {
    postId: string;
    userId: string;
  };

  if (!postId || !userId) {
    throw new HttpsError('invalid-argument', 'Missing postId or userId');
  }

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
});

export const getFreshContentSecondGen = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to fetch posts.'
    );
  }

  const uid = request.auth.uid;
  const {
    geoPoint,
    radius,
    pageSize = 3,
    lastVisible = null,
  } = request.data as {
    geoPoint: GeoPointType;
    radius: number;
    pageSize?: number;
    lastVisible?: string | null;
  };

  const result = await postService.getFreshContent(
    geoPoint,
    radius,
    uid,
    pageSize,
    lastVisible
  );
  return result;
});

export const getPostsByPlaceIdSecondGen = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to fetch posts.'
    );
  }

  const uid = request.auth.uid;
  const {
    placeId,
    pageSize = 3,
    lastVisible = null,
  } = request.data as {
    placeId: string;
    pageSize?: number;
    lastVisible?: string | null;
  };

  const result = await postService.getPostsByPlaceId(
    uid,
    placeId,
    pageSize,
    lastVisible
  );
  return result;
});

export const saveNotificationSecondGen = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to save notifications'
    );
  }

  const userId = request.auth.uid;
  return await notificationService.saveNotification({
    userId,
    ...request.data,
  });
});

export const getCurrentUserSecondGen = onCall<void, User>(async req => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('Unauthenticated: must be logged in');
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      logger.error(`User ${uid} not found`);
      throw new Error('User not found');
    }

    return { id: userDoc.id, ...userDoc.data() } as User;
  } catch (error) {
    logger.error('Error getting user data:', error);
    throw new Error('Failed to get user data');
  }
});

export const getUserNotificationsSecondGen = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to get notifications'
    );
  }

  const userId = request.auth.uid;
  return await notificationService.getUserNotifications(userId);
});

export const markAllNotificationsAsSeenSecondGen = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to mark notifications'
    );
  }

  const userId = request.auth.uid;
  return await notificationService.markAllNotificationsAsSeen(userId);
});

export const deleteNotificationSecondGen = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to delete notifications'
    );
  }

  const { notificationId } = request.data as { notificationId: string };
  if (!notificationId) {
    throw new HttpsError('invalid-argument', 'Notification ID is required');
  }

  return await notificationService.deleteNotification(notificationId);
});

export const addCommentSecondGen = onCall(async request => {
  const { postId, userId, commentText } = request.data as {
    postId: string;
    userId: string;
    commentText: string;
  };

  return await commentService.addComment(postId, userId, commentText);
});

export const getPostCommentsSecondGen = onCall(async request => {
  const { postId } = request.data as { postId: string };
  return await commentService.getPostComments(postId);
});

export const getPostByIdSecondGen = onCall(async request => {
  const { postId } = request.data as { postId: string };
  if (!postId) throw new HttpsError('invalid-argument', 'Post ID is required');

  const postDoc = await db.collection('posts').doc(postId).get();
  if (!postDoc.exists) throw new HttpsError('not-found', 'Post not found');

  const postData = postDoc.data() as Post;
  const likesSnapshot = await db
    .collection('posts')
    .doc(postId)
    .collection('likes')
    .get();
  const commentsSnapshot = await db
    .collection('posts')
    .doc(postId)
    .collection('comments')
    .get();

  let isLiked = false;
  if (request.auth) {
    const uid = request.auth.uid;
    const likeSnapshot = await db
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .doc(uid)
      .get();
    isLiked = likeSnapshot.exists;
  }

  return {
    ...postData,
    id: postId,
    likesCount: likesSnapshot.size,
    commentsCount: commentsSnapshot.size,
    isLiked,
  };
});

// ----------------- SCHEDULE FUNCTIONS -----------------

export const deleteOldPostsAndImagesSecondGen = onSchedule(
  'every 60 minutes',
  async () => {
    const threeDaysInSeconds = 3 * 24 * 60 * 60;
    const threeDaysAgo =
      admin.firestore.Timestamp.now().seconds - threeDaysInSeconds;
    const timestampThreeDaysAgo = new admin.firestore.Timestamp(
      threeDaysAgo,
      0
    );

    const postsSnapshot = await db
      .collection('posts')
      .where('creationTime', '<', timestampThreeDaysAgo)
      .get();

    const deleteOperations = postsSnapshot.docs.map(async doc => {
      const postData = doc.data() as Post;
      const filePath = `${postData.folderId}/${postData.fileId}`;

      const notificationsSnapshot = await db
        .collection('notifications')
        .where('postId', '==', doc.id)
        .get();
      const deleteNotificationsPromises = notificationsSnapshot.docs.map(n =>
        n.ref.delete()
      );

      return Promise.all([
        admin.storage().bucket().file(filePath).delete(),
        deleteSubcollection(doc.ref, 'likes'),
        deleteSubcollection(doc.ref, 'comments'),
        doc.ref.delete(),
        ...deleteNotificationsPromises,
      ]);
    });

    await Promise.all(deleteOperations);
    console.info(
      `Deleted ${postsSnapshot.size} old posts and their associated data`
    );
  }
);

export const deleteRecentExpiredRequestsSecondGen = onSchedule(
  'every 15 minutes',
  async () => {
    const threeMinutesAgo = admin.firestore.Timestamp.now().seconds - 3 * 60;
    const timestamp = new admin.firestore.Timestamp(threeMinutesAgo, 0);

    const expiredNotificationsSnapshot = await db
      .collection('notifications')
      .where('notificationType', '==', 'REQUEST')
      .where('creationTime', '<', timestamp)
      .limit(1000)
      .get();

    if (!expiredNotificationsSnapshot.empty) {
      const batchSize = 500;
      for (
        let i = 0;
        i < expiredNotificationsSnapshot.docs.length;
        i += batchSize
      ) {
        const batch = expiredNotificationsSnapshot.docs
          .slice(i, i + batchSize)
          .map(doc => doc.ref.delete());
        await Promise.all(batch);
      }
      console.info(
        `Deleted ${expiredNotificationsSnapshot.size} expired request notifications`
      );
    }
  }
);

export const deleteAllExpiredRequestsSecondGen = onSchedule(
  'every 6 hours',
  async () => {
    const threeDaysAgo =
      admin.firestore.Timestamp.now().seconds - 3 * 24 * 60 * 60;
    const timestamp = new admin.firestore.Timestamp(threeDaysAgo, 0);

    const expiredNotificationsSnapshot = await db
      .collection('notifications')
      .where('creationTime', '<', timestamp)
      .get();

    if (!expiredNotificationsSnapshot.empty) {
      const batchSize = 500;
      for (
        let i = 0;
        i < expiredNotificationsSnapshot.docs.length;
        i += batchSize
      ) {
        const batch = expiredNotificationsSnapshot.docs
          .slice(i, i + batchSize)
          .map(doc => doc.ref.delete());
        await Promise.all(batch);
      }
      console.info(
        `Deleted ${expiredNotificationsSnapshot.size} expired request notifications`
      );
    }
  }
);

// ----------------- HELPER FUNCTIONS -----------------

async function deleteSubcollection(
  postRef: FirebaseFirestore.DocumentReference,
  subcollectionName: string
) {
  const snapshot = await postRef.collection(subcollectionName).get();
  await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
}
