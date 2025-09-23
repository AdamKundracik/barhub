import { httpsCallable } from 'firebase/functions';
import {
  GetNotificationsResult,
  MarkNotificationReadResult,
  SaveNotificationRequest,
} from '../types/notification-types';
import { functions } from '@/firebaseConfig';
import { SaveNotificationResponse } from '@/common/types/notificationTypes';

/**
 * Saves a new notification
 * @param notification - The notification data to save (without creationTime)
 * @returns Promise with the saved notification data
 */
export const saveNotification = async (
  notification: Omit<
    SaveNotificationRequest,
    'creationTime' | 'userId' | 'postId'
  >
): Promise<SaveNotificationResponse> => {
  const cloudFunction = httpsCallable(functions, 'saveNotificationSecondGen');
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
    const cloudFunction = httpsCallable(
      functions,
      'getUserNotificationsSecondGen'
    );
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

/**
 * Deletes specific notification by ID
 * @param notificationId ID of the notification to delete
 * @returns Promise with success status and count of deleted notifications
 */
export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean }> => {
  const cloudFunction = httpsCallable(functions, 'deleteNotificationSecondGen');
  const response = (await cloudFunction({
    notificationId,
  })) as unknown as { success: boolean };
  return response;
};

export const sendNotification = async (
  latitude: number,
  longitude: number
): Promise<string[]> => {
  if (latitude === undefined || longitude === undefined) return [];

  const cloudFunction = httpsCallable<
    { latitude: number; longitude: number },
    string[]
  >(functions, 'sendNotificationHandler');

  const { data: response } = await cloudFunction({
    latitude,
    longitude,
  });

  return response ?? [];
};
