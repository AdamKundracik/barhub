import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebaseConfig';
import {
  GetUserNotificationsResponse,
  MarkNotificationReadResult,
} from '../types/notification-types';

export type NotificationRecipients = {
  userId: string;
  pushToken: string;
};

// ----------------- SAVE / FETCH / DELETE -----------------

export const getUserNotifications =
  async (): Promise<GetUserNotificationsResponse> => {
    const cloudFunction = httpsCallable(
      functions,
      'getUserNotificationsSecondGen'
    );
    const response = (await cloudFunction()).data;
    return response as GetUserNotificationsResponse;
  };

export const markAllNotificationsAsSeen =
  async (): Promise<MarkNotificationReadResult> => {
    const cloudFunction = httpsCallable(
      functions,
      'markAllNotificationsAsSeenSecondGen'
    );
    const response = (await cloudFunction()).data;
    return response as MarkNotificationReadResult;
  };

export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean }> => {
  const cloudFunction = httpsCallable(functions, 'deleteNotificationSecondGen');
  const response = (await cloudFunction({ notificationId })).data;
  return response as { success: boolean };
};

// ----------------- PUSH NOTIFICATIONS -----------------

export const sendRequestNotificationToRecipients = async (
  placeId: string,
  placeName: string,
  placeLocation: { latitude: number; longitude: number },
  senderToken: string
): Promise<boolean> => {
  const cloudFunction = httpsCallable<
    {
      placeId: string;
      placeName: string;
      placeLocation: { latitude: number; longitude: number };
      senderToken: string;
    },
    { success: boolean; recipients: string[] }
  >(functions, 'sendRequestNotificationSecondGen');

  const { data } = await cloudFunction({
    placeId,
    placeName,
    placeLocation,
    senderToken,
  });
  console.log(data);
  return data.success;
};

// FE service
export const sendResponseNotificationToRecipients = async (
  placeId: string,
  senderToken: string,
  postId: string
): Promise<boolean> => {
  const cloudFunction = httpsCallable<
    { placeId: string; senderToken: string; postId: string },
    { success: boolean; recipients: string[] }
  >(functions, 'sendResponseNotificationSecondGen');

  const { data } = await cloudFunction({ placeId, senderToken, postId });
  return data.success;
};
