import {
  GetUserNotificationsResponse,
  SaveNotificationResponse,
} from '../../../../common/types/notificationTypes';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import {
  GetNotificationsResult,
  NotificationItem,
  SaveNotificationResult,
} from '../types/notification-types';

/**
 * Saves a new notification
 * @param notification - The notification data to save (without creationTime)
 * @returns Promise with the saved notification data
 */
export const saveNotification = async (
  notification: Omit<
    NotificationItem,
    'creationTime' | 'userId' | 'postId' | 'id'
  >
): Promise<SaveNotificationResult> => {
  console.log('notif', notification);
  const cloudFunction = httpsCallable(functions, 'saveNotification');
  const response = (await cloudFunction({
    ...notification,
  })) as unknown as SaveNotificationResult;
  return response;
};

/**
 * Fetches all notifications for the authenticated user
 * @returns Promise with array of user's notifications
 */
export const getUserNotifications =
  async (): Promise<GetNotificationsResult> => {
    const cloudFunction = httpsCallable(functions, 'getUserNotifications');
    const response =
      (await cloudFunction()) as unknown as GetNotificationsResult;
    return response;
  };
