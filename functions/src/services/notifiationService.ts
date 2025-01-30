import {
  GetUserNotificationsResponse,
  Notification,
  SaveNotificationRequest,
  SaveNotificationResponse,
} from '../../../common/types/notificationTypes';
import functions, { https } from 'firebase-functions';
import * as admin from 'firebase-admin';

class NotifiationService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async saveNotification(
    data: SaveNotificationRequest
  ): Promise<SaveNotificationResponse> {
    const { label, text, postId } = data;

    try {
      const notificationDoc = {
        ...data,
        creationTime: admin.firestore.Timestamp.now(), // Using Firebase Firestore Timestamp
        userId: data.userId,
      };

      const addedNotificationRef = await this.db
        .collection('notifications')
        .add(notificationDoc);

      const addedNotificationSnapshot = await addedNotificationRef.get();
      const addedNotification =
        addedNotificationSnapshot.data() as Notification;

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
        ...(doc.data() as Notification),
        id: doc.id,
      }));

      // Check for new notifications if lastCheckedTime is provided
      let hasNewNotifications = false;
      let newNotificationsCount = 0;

      if (lastCheckedTime) {
        newNotificationsCount = notifications.filter(
          notification =>
            notification.creationTime.toMillis() > lastCheckedTime.toMillis()
        ).length;
        hasNewNotifications = newNotificationsCount > 0;
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
}

export default NotifiationService;
