import { SaveNotificationResponse } from '../../../../common/types/notificationTypes';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import {
  GetNotificationsResult,
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
 * Deletes specific notification by ID
 * @param notificationId ID of the notification to delete
 * @returns Promise with success status and count of deleted notifications
 */
export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean }> => {
  const cloudFunction = httpsCallable(functions, 'deleteNotification');
  const response = (await cloudFunction({
    notificationId,
  })) as unknown as { success: boolean };
  return response;
};
