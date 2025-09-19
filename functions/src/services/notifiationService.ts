import {
  GetUserNotificationsResponse,
  NotificationItem,
  SaveNotificationRequest,
  SaveNotificationResponse,
} from '../../../common/types/notificationTypes';
import { https } from 'firebase-functions';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/https';
import { UserDocument } from '../documentTypes/User';

class NotificationService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async saveNotification(
    data: SaveNotificationRequest
  ): Promise<SaveNotificationResponse> {
    try {
      const notificationDoc = {
        ...data,
        read: false,
        creationTime: admin.firestore.Timestamp.now(),
        userId: data.userId,
        placeId: data.placeId,
        senderToken: data.senderToken,
      };

      const addedNotificationRef = await this.db
        .collection('notifications')
        .add(notificationDoc);

      const addedNotificationSnapshot = await addedNotificationRef.get();
      const addedNotification =
        addedNotificationSnapshot.data() as NotificationItem;

      return {
        id: addedNotificationRef.id,
        ...addedNotification,
      };
    } catch (error: any) {
      console.error('Error adding notification: ', error);
      throw new Error(`Failed to save notification: ${error.message}`);
    }
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

      const notifications = notificationsSnapshot.docs.map(doc => ({
        ...(doc.data() as NotificationItem),
        id: doc.id,
      }));

      const newNotificationsCount = notifications.filter(
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
        notifications,
        hasNewNotifications,
        newNotificationsCount,
      };
    } catch (error: any) {
      console.error('Error fetching notifications: ', error);
      throw new https.HttpsError(
        'internal',
        `Error fetching notifications: ${error.message || 'An unknown error occurred'}`
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

  async sendNotification(
    uid: string,
    placeLocation: { latitude: number; longitude: number }
  ): Promise<string[]> {
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
          const location = doc.get('location');
          const lat = location?.latitude;
          const lng = location?.longitude;

          if (lat !== undefined && lng !== undefined) {
            const distanceInM =
              distanceBetween([lat, lng], locationArray) * 1000;

            if (
              //TODO: Change radius to 30
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

      const tokens = matchingUsers
        .map(user => user.pushToken)
        .filter(token => token && token !== uid);

      return tokens;
    } catch (error: any) {
      throw new HttpsError(
        'internal',
        `Failed to fetch nearby users: ${error.message}`
      );
    }
  }
}

export default NotificationService;
