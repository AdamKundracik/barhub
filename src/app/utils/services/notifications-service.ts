import { SaveNotificationResponse } from '../../../../common/types/notificationTypes';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import {
  GetNotificationsResult,
  MarkNotificationReadResult,
  SaveNotificationRequest,
} from '../types/notification-types';

/**
 * Saves a new notification
 * @param notification - The notification data to save (without creationTime)
 * @returns Promise with the saved notification data
 */
export const saveNotification = async (
  notification: Omit<
    SaveNotificationRequest,
    'creationTime' | 'userId' | 'id' | 'postId'
  >
): Promise<SaveNotificationResponse> => {
  const cloudFunction = httpsCallable(functions, 'saveNotification');
  const response = (await cloudFunction({
    ...notification,
  })) as unknown as SaveNotificationResponse;
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

/**
 * Marks all notifications as seen for the authenticated user
 * @returns Promise with success status and count of updated notifications
 */
export const markAllNotificationsAsSeen =
  async (): Promise<MarkNotificationReadResult> => {
    const cloudFunction = httpsCallable(
      functions,
      'markAllNotificationsAsSeen'
    );
    const response =
      (await cloudFunction()) as unknown as MarkNotificationReadResult;
    return response;
  };
