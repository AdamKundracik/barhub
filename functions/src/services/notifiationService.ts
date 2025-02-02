import {
  GetUserNotificationsResponse,
  NotificationItem,
  SaveNotificationRequest,
  SaveNotificationResponse,
} from '../../../common/types/notificationTypes';
import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';

class NotifiationService {
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
        creationTime: admin.firestore.Timestamp.now(), // Using Firebase Firestore Timestamp
        userId: data.userId,
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
    } catch (error) {
      console.error('Error adding notification: ', error);
      throw new Error(`Failed to save notification: ${error.message}`);
    }
  }

  /**
   * Retrieves all notifications for a specific user and checks for new ones
   * @param userId - The ID of the user whose notifications to fetch
   * @param lastCheckedTime - Optional timestamp of when notifications were last checked
   * @returns Promise with an array of notifications and new notifications info
   * @throws HttpsError if userId is missing or if there's an internal error
   */
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

      // Count both unread notifications and those newer than last check
      const newNotificationsCount = notifications.filter(
        notification =>
          !notification.read ||
          (lastCheckedTime &&
            notification.creationTime.toMillis() > lastCheckedTime.toMillis())
      ).length;

      const hasNewNotifications = newNotificationsCount > 0;

      // Update user's last notification check time
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
    } catch (error) {
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
      // Get all unread notifications for the user
      const batch = this.db.batch();

      const notificationsSnapshot = await this.db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      // Update each notification in a batch
      notificationsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      // Commit the batch
      await batch.commit();

      return {
        success: true,
        updatedCount: notificationsSnapshot.docs.length,
      };
    } catch (error) {
      console.error('Error marking notifications as seen: ', error);
      throw new https.HttpsError(
        'internal',
        `Error marking notifications as seen: ${error.message || 'An unknown error occurred'}`
      );
    }
  }
}

export default NotifiationService;
