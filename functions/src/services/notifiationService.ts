import {
  GetUserNotificationsResponse,
  NotificationItem,
  NotificationType,
} from '../../../common/types/notificationTypes';
import { https } from 'firebase-functions';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/https';
import { UserDocument } from '../documentTypes/User';
// NotificationSender.ts
import fetch from 'node-fetch';
import { generateUID } from '../../../src/app/utils/helper-functions/generateUID';

class NotificationService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async saveNotificationForUser(
    userId: string,
    senderId: string,
    notificationType: NotificationType,
    options?: {
      postId?: string;
      placeId?: string;
      senderToken?: string;
    }
  ): Promise<NotificationItem> {
    const id = this.db.collection('notifications').doc().id;

    const notificationDoc: NotificationItem = {
      id,
      userId,
      senderId,
      notificationType,
      postId: options?.postId || '',
      placeId: options?.placeId || '',
      senderToken: options?.senderToken || '',
      read: false,
      creationTime: admin.firestore.Timestamp.now(),
    };

    await this.db.collection('notifications').doc(id).set(notificationDoc);

    return notificationDoc;
  }

  async getUserNotifications(
    userId: string,
    lastCheckedTime?: admin.firestore.Timestamp
  ): Promise<GetUserNotificationsResponse> {
    if (!userId) {
      throw new https.HttpsError(
        'invalid-argument',
        'Missing required field: userId'
      );
    }

    try {
      const notificationsSnapshot = await this.db
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('creationTime', 'desc')
        .get();

      // Načítaj všetky notifikácie
      const notifications = notificationsSnapshot.docs.map(doc => ({
        ...(doc.data() as NotificationItem),
        id: doc.id,
      }));

      // Pre každú notifikáciu dotiahni displayName
      const enrichedNotifications: NotificationItem[] = [];
      for (const notification of notifications) {
        let senderName = 'Unknown';

        if (notification.senderId) {
          const senderDoc = await this.db
            .collection('users')
            .doc(notification.senderId)
            .get();

          if (senderDoc.exists) {
            senderName = senderDoc.data()?.displayName || 'Unknown';
          }
        }

        enrichedNotifications.push({
          ...notification,
          senderName,
        });
      }

      const newNotificationsCount = enrichedNotifications.filter(
        notification =>
          !notification.read ||
          (lastCheckedTime &&
            notification.creationTime.toMillis() > lastCheckedTime.toMillis())
      ).length;

      const hasNewNotifications = newNotificationsCount > 0;

      if (lastCheckedTime) {
        await this.db.collection('users').doc(userId).update({
          lastNotificationCheck: admin.firestore.Timestamp.now(),
        });
      }

      return {
        notifications: enrichedNotifications,
        hasNewNotifications,
        newNotificationsCount,
      };
    } catch (error: any) {
      console.error('Error fetching notifications: ', error);
      throw new https.HttpsError(
        'internal',
        `Error fetching notifications: ${
          error.message || 'An unknown error occurred'
        }`
      );
    }
  }

  async markAllNotificationsAsSeen(userId: string) {
    if (!userId) {
      throw new https.HttpsError(
        'invalid-argument',
        'Missing required field: userId'
      );
    }

    try {
      const batch = this.db.batch();

      const notificationsSnapshot = await this.db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      notificationsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();

      return {
        success: true,
        updatedCount: notificationsSnapshot.docs.length,
      };
    } catch (error: any) {
      console.error('Error marking notifications as seen: ', error);
      throw new https.HttpsError(
        'internal',
        `Error marking notifications as seen: ${error.message || 'An unknown error occurred'}`
      );
    }
  }

  async deleteNotification(notificationId: string) {
    if (!notificationId) {
      throw new https.HttpsError(
        'invalid-argument',
        'Missing required field: notificationId'
      );
    }

    try {
      const notificationDoc = await this.db
        .collection('notifications')
        .doc(notificationId)
        .get();

      if (notificationDoc.exists) {
        await notificationDoc.ref.delete();

        return {
          success: true,
        };
      } else {
        throw new https.HttpsError('not-found', 'Notification not found');
      }
    } catch (error: any) {
      throw new https.HttpsError(
        'internal',
        `Error deleting notification: ${error.message || 'An unknown error occurred'}`
      );
    }
  }

  async getRecipientsInRadius(
    uid: string,
    placeLocation: { latitude: number; longitude: number }
  ): Promise<{ userId: string; pushToken: string }[]> {
    if (
      placeLocation.latitude === undefined ||
      placeLocation.longitude === undefined
    ) {
      throw new HttpsError('invalid-argument', 'Invalid location data.');
    }

    const locationArray: [number, number] = [
      placeLocation.latitude,
      placeLocation.longitude,
    ];

    try {
      const bounds = geohashQueryBounds(locationArray, 8000); // 8 km radius
      const promises = bounds.map(b =>
        this.db
          .collection('users')
          .orderBy('geohash')
          .startAt(b[0])
          .endAt(b[1])
          .get()
      );
      const snapshots = await Promise.all(promises);

      const matchingUsers: UserDocument[] = [];

      for (const snap of snapshots) {
        snap.docs.forEach(doc => {
          const isUsingFakeLocation = doc.get('isUsingFakeLocation');
          if (isUsingFakeLocation) return;

          const location = doc.get('location');
          const lat = location?.latitude;
          const lng = location?.longitude;

          if (lat !== undefined && lng !== undefined) {
            const distanceInM =
              distanceBetween([lat, lng], locationArray) * 1000;

            if (
              Math.floor(distanceInM) <= 8000 &&
              (doc.data() as UserDocument).id !== uid
            ) {
              matchingUsers.push(doc.data() as UserDocument);
            }
          }
        });
      }

      if (matchingUsers.length === 0) {
        return [];
      }

      // Rozbaliť pushToken pole na jednotlivé tokeny
      const recipients: { userId: string; pushToken: string }[] = [];

      matchingUsers.forEach(user => {
        if (Array.isArray(user.pushToken)) {
          user.pushToken.forEach(token => {
            recipients.push({ userId: user.id, pushToken: token });
          });
        } else if (user.pushToken) {
          // fallback keby staré dáta mali string
          recipients.push({ userId: user.id, pushToken: user.pushToken });
        }
      });

      return recipients;
    } catch (error: any) {
      throw new HttpsError(
        'internal',
        `Failed to fetch nearby users: ${error.message}`
      );
    }
  }
}

export async function sendNotificationToRecipients(
  recipients: { userId: string; pushToken: string }[],
  message: {
    title: string;
    body: string;
    data: Record<string, any>;
  }
): Promise<string[]> {
  const uniqueUserIds = new Set<string>();

  for (const recipient of recipients) {
    uniqueUserIds.add(recipient.userId);

    const expoMessage = {
      to: recipient.pushToken,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: {
        ...message.data,
        userId: recipient.userId,
      },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoMessage),
    });
  }

  return Array.from(uniqueUserIds);
}

export async function sendPushNotificationResponse(
  recipients: { userId: string; pushToken: string }[],
  placeId: string,
  postId: string
) {
  return sendNotificationToRecipients(recipients, {
    title: 'Someone posted photo from requested place!',
    body: 'Check out how it looks inside!',
    data: {
      placeId,
      postId,
      notificationType: NotificationType.RESPONSE,
      id: generateUID(),
    },
  });
}

export async function sendRequestNotification(
  recipients: { userId: string; pushToken: string }[],
  placeId: string,
  placeName: string,
  senderToken: string,
  notificationTTL: number = 180 * 1000
) {
  return sendNotificationToRecipients(recipients, {
    title: `${placeName} photo request!`,
    body: 'Will you show him how it looks inside?',
    data: {
      placeId,
      senderToken,
      notificationTTL,
      sentAt: new Date().toISOString(),
      notificationType: NotificationType.REQUEST,
      id: generateUID(),
    },
  });
}

export async function sendLikeNotification(
  recipients: { userId: string; pushToken: string }[],
  request: { username: string; postId: string }
) {
  return sendNotificationToRecipients(recipients, {
    title: 'New like!',
    body: `${request.username} liked your post!`,
    data: {
      notificationType: NotificationType.LIKE,
      username: request.username,
      postId: request.postId,
      id: generateUID(),
    },
  });
}

export async function sendCommentNotification(
  recipients: { userId: string; pushToken: string }[],
  request: { username: string; postId: string; commentText: string }
) {
  const truncatedText =
    request.commentText.length > 500
      ? request.commentText.slice(0, 500) + '...'
      : request.commentText;

  return sendNotificationToRecipients(recipients, {
    title: 'New comment!',
    body: `${request.username} commented: ${truncatedText}`,
    data: {
      notificationType: NotificationType.COMMENT,
      username: request.username,
      postId: request.postId,
      commentText: request.commentText,
      id: generateUID(),
    },
  });
}

export default NotificationService;
