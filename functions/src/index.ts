import PostService from './services/postService';
import CommentService from './services/CommentService';
import NotifiationService, {
  sendLikeNotification,
  sendPushNotificationResponse,
  sendRequestNotification,
} from './services/notifiationService';
import { ReportService } from './services/reportService';
import * as admin from 'firebase-admin';
import { GeoPointType } from './documentTypes/Post';

// ----------------- CALLABLE FUNCTIONS -----------------
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { Post } from '../../common/types/postTypes';
import { onSchedule } from 'firebase-functions/scheduler';
import * as logger from 'firebase-functions/logger';
import { UserService } from './services/userService';
import { NotificationType } from '../../common/types/notificationTypes';
import { LeaderboardService } from './services/leaderBoardService';

export interface StatusResponse {
  success: boolean;
}

type CanUploadPhotoResponse =
  | { canUpload: true }
  | { canUpload: false; remainingSeconds: number };

const functionOptions = {
  region: ['europe-west1'],
  memory: '256MiB',
  timeoutSeconds: 60,
  concurrency: 10,
};

admin.initializeApp();
const db = admin.firestore();
const functions = require('firebase-functions');

const postService = new PostService();
const commentService = new CommentService();
const notificationService = new NotifiationService();
const reportService = new ReportService();
const userService = new UserService();
const leaderboardService = new LeaderboardService();

export const canUploadPhoto = onCall(functionOptions, async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error('Unauthenticated: must be logged in');
  }

  return userService.canUploadPhoto(uid);
});

export const getLeaderboard = onCall(functionOptions, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');

  // period môže prísť z request.data
  const period: 'week' | 'all' = request.data?.period || 'all';

  return leaderboardService.getTopUsersWithCurrent(uid, period);
});

export const addPhotoPoints = onCall(functionOptions, async request => {
  const uid = request.auth?.uid;
  logger.error('UID', uid);
  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');

  return leaderboardService.addPhotoPoints(uid);
});

export const toggleLikeSecondGen = onCall(functionOptions, async request => {
  const { postId, senderUserName } = request.data as {
    postId: string;
    senderUserName: string;
  };
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');
  if (!postId) throw new HttpsError('invalid-argument', 'Missing postId');

  const likeDocRef = db
    .collection('posts')
    .doc(postId)
    .collection('likes')
    .doc(uid);
  const likeDoc = await likeDocRef.get();

  const postDoc = await db.collection('posts').doc(postId).get();
  if (!postDoc.exists) throw new HttpsError('not-found', 'Post not found');

  const postAuthorId = postDoc.data()?.userId;
  if (!postAuthorId) throw new HttpsError('internal', 'Post authorId missing');

  if (likeDoc.exists) {
    // 🗑️ Unlike
    await likeDocRef.delete();

    if (uid !== postAuthorId) {
      // body odpočítame iba ak nie je vlastný post
      await leaderboardService.removeLikePoints(postAuthorId);
    }

    return { liked: false };
  } else {
    // ❤️ Like
    await likeDocRef.set({ createdAt: new Date() });

    if (uid !== postAuthorId) {
      // body pridáme iba ak nie je vlastný post
      await leaderboardService.addLikePoints(postAuthorId);

      const userDoc = await db.collection('users').doc(postAuthorId).get();
      const pushTokens = userDoc.data()?.pushToken as string[] | undefined;

      if (pushTokens && pushTokens.length > 0) {
        const recipients = pushTokens.map(token => ({
          userId: postAuthorId,
          pushToken: token,
        }));
        try {
          const pushSent = await sendLikeNotification(recipients, {
            username: senderUserName,
            postId,
          });
          if (pushSent) {
            await notificationService.saveNotificationForUser(
              postAuthorId,
              uid,
              NotificationType.LIKE,
              { postId }
            );
          }
        } catch (error) {
          logger.error('Failed to send like notification', { error });
        }
      }
    }

    return { liked: true };
  }
});

// === REQUEST NOTIFICATION ===
export const sendRequestNotificationSecondGen = onCall<
  {
    placeId: string;
    placeName: string;
    placeLocation: { latitude: number; longitude: number };
    senderToken: string;
    userId: string;
    senderId: string;
  },
  { success: boolean; recipients: string[] }
>(functionOptions, async req => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');

  const { placeId, placeName, placeLocation, senderToken } = req.data;
  const recipients = await notificationService.getRecipientsInRadius(
    uid,
    placeLocation
  );

  const uniqueUserIds = await sendRequestNotification(
    recipients,
    placeId,
    placeName,
    senderToken
  );

  await Promise.all(
    uniqueUserIds.map(
      async userId =>
        await notificationService.saveNotificationForUser(
          userId,
          uid,
          NotificationType.REQUEST,
          {
            placeId: placeId,
            senderToken: senderToken,
          }
        )
    )
  );

  return { success: true, recipients: uniqueUserIds };
});

// === RESPONSE NOTIFICATION ===
export const sendResponseNotificationSecondGen = onCall<
  { placeId: string; senderToken: string; postId: string; userId: string },
  { success: boolean; recipients: string[] }
>(functionOptions, async req => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');

  const { placeId, senderToken, postId } = req.data;

  // Find the user whose pushToken array contains senderToken
  const usersSnapshot = await admin
    .firestore()
    .collection('users')
    .where('pushToken', 'array-contains', senderToken)
    .get();

  if (usersSnapshot.empty) {
    throw new HttpsError('not-found', 'Recipient user not found');
  }

  const recipients = usersSnapshot.docs.map(doc => ({
    userId: doc.id,
    pushToken: senderToken,
  }));

  const uniqueUserIds = await sendPushNotificationResponse(
    recipients,
    placeId,
    postId
  );

  await Promise.all(
    uniqueUserIds.map(
      async userId =>
        await notificationService.saveNotificationForUser(
          userId,
          uid,
          NotificationType.RESPONSE,
          {
            postId: postId,
            placeId: placeId,
          }
        )
    )
  );

  return { success: true, recipients: uniqueUserIds };
});

export const addPushTokenSecondGen = onCall(functionOptions, async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to add push token'
    );
  }

  const userId = request.auth.uid;
  const token: string = request.data?.token;

  if (!token) {
    throw new HttpsError('invalid-argument', 'Push token must be provided');
  }

  await userService.addPushToken({ userId, token });
  return { success: true };
});

// --- Remove Push Token ---
export const removePushTokenSecondGen = onCall(
  functionOptions,
  async request => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to remove push token'
      );
    }

    const userId = request.auth.uid;
    const token: string = request.data?.token;

    if (!token) {
      throw new HttpsError('invalid-argument', 'Push token must be provided');
    }

    await userService.removePushToken({ userId, token });
    return { success: true };
  }
);

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

export const reportPostSecondGen = onCall<ReportPostData, any>(
  functionOptions,
  async req => {
    const { postId, userId, reason } = req.data;

    try {
      return await reportService.reportPost(userId, postId, reason);
    } catch (error: any) {
      logger.error('Error reporting post:', error);
      throw new Error(error.message || 'Error reporting post');
    }
  }
);

export const setUserSecondGen = onCall<{ user: User }, StatusResponse>(
  functionOptions,
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
  functionOptions,
  async req => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new Error('Unauthenticated: must be logged in');
    }

    const { post } = req.data;
    try {
      const result = await postService.savePost(uid, post);
      await leaderboardService.addPhotoPoints(uid);
      return result;
    } catch (error) {
      logger.error('Failed to save post:', error);
      throw new Error('Failed to save post');
    }
  }
);

export const deletePostSecondGen = onCall(functionOptions, async request => {
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

  const result = await postService.deletePost(postId, request.auth.uid);
  return result;
});

export const getFreshContentSecondGen = onCall(
  functionOptions,
  async request => {
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
  }
);

export const getPostsByPlaceIdSecondGen = onCall(
  functionOptions,
  async request => {
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
  }
);

export const getCurrentUserSecondGen = onCall<void, User>(
  functionOptions,
  async req => {
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
  }
);

export const getUserNotificationsSecondGen = onCall(
  functionOptions,
  async request => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to get notifications'
      );
    }

    const userId = request.auth.uid;
    return await notificationService.getUserNotifications(userId);
  }
);

export const markAllNotificationsAsSeenSecondGen = onCall(
  functionOptions,
  async request => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to mark notifications'
      );
    }

    const userId = request.auth.uid;
    return await notificationService.markAllNotificationsAsSeen(userId);
  }
);

export const deleteNotificationSecondGen = onCall(
  functionOptions,
  async request => {
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
  }
);

export const addCommentSecondGen = onCall(functionOptions, async request => {
  const { postId, userId, commentText } = request.data as {
    postId: string;
    userId: string;
    commentText: string;
  };

  return await commentService.addComment(postId, userId, commentText);
});

export const getPostCommentsSecondGen = onCall(
  functionOptions,
  async request => {
    const { postId } = request.data as { postId: string };
    return await commentService.getPostComments(postId);
  }
);

export const getPostByIdSecondGen = onCall(functionOptions, async request => {
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
  { region: 'europe-west1', schedule: 'every 60 minutes' },
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
  { region: 'europe-west1', schedule: 'every 15 minutes' },
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
  { region: 'europe-west1', schedule: 'every 60 minutes' },
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
