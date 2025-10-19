import { notificationService } from '@/src/app/services/notificationService';
import {
  GetUserNotificationsResponse,
  MarkNotificationReadResult,
  NotificationItem,
  NotificationType,
} from '../types/notification-types';
import { useUserStore } from '../store/userStore';
import { NotificationDTO } from '@/src/app/types/dto';

export type NotificationRecipients = {
  userId: string;
  pushToken: string;
};

// Map backend NotificationDTO to frontend NotificationItem
const mapNotificationDTOToItem = (dto: NotificationDTO): NotificationItem => {
  // Use LocalDateTime string directly from backend
  // Backend sends: "2025-10-07T22:29:23.517475" or "2025-10-07 22:29:23.517475"
  const creationTime = dto.createdAt.includes('T')
    ? dto.createdAt
    : dto.createdAt.replace(' ', 'T');

  // Map notification type to frontend format
  // Note: label and text are not used in UI (NotificationItemComponent generates them with i18n)
  // They're kept for backwards compatibility and potential future use
  let notificationType: NotificationType;
  let label;
  let text;

  switch (dto.notificationType) {
    case 'LIKE':
      notificationType = NotificationType.LIKE;
      label = 'new-like'; // Translation key
      text = dto.senderName; // UI will add "liked your photo"
      break;
    case 'COMMENT':
      notificationType = NotificationType.COMMENT;
      label = 'new-comment'; // Translation key
      text = dto.commentText || dto.senderName; // Comment text or sender name
      break;
    case 'REQUEST':
      notificationType = NotificationType.REQUEST;
      label = 'request'; // Translation key
      text = dto.senderName; // UI will add "sent you a request"
      break;
    case 'RESPONSE':
      notificationType = NotificationType.RESPONSE;
      label = 'response'; // Translation key
      text = dto.senderName; // UI will add "responded to your request"
      break;
    default:
      notificationType = NotificationType.LIKE;
      label = 'notification';
      text = dto.senderName;
  }

  return {
    id: dto.id.toString(),
    postId: dto.postId?.toString() || '',
    label,
    text,
    creationTime,
    userId: dto.userId.toString(),
    notificationType,
    senderToken: dto.senderToken,
    placeId: dto.placeId,
    sender: dto.sender, // Full sender ClientDTO object
    senderName: dto.senderName,
    senderId: dto.sender?.id?.toString(),
    read: dto.read,
  };
};

// ----------------- SAVE / FETCH / DELETE -----------------

export const getUserNotifications =
  async (): Promise<GetUserNotificationsResponse> => {
    try {
      const userId = useUserStore.getState().getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await notificationService.getUserNotifications(userId);

      // Convert backend DTOs to frontend NotificationItems
      const notifications = (response.notifications || []).map(
        mapNotificationDTOToItem
      );

      return {
        notifications,
        hasNewNotifications: response.hasNewNotifications,
        newNotificationsCount: response.newNotificationsCount || 0,
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return {
        notifications: [],
        hasNewNotifications: false,
        newNotificationsCount: 0,
      };
    }
  };

export const markAllNotificationsAsSeen =
  async (): Promise<MarkNotificationReadResult> => {
    try {
      const userId = useUserStore.getState().getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await notificationService.markAllAsSeen(userId);
      return {
        success: response?.success || false,
        updatedCount: response?.updatedCount || 0,
      };
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
      return { success: false, updatedCount: 0 };
    }
  };

export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean }> => {
  try {
    const success = await notificationService.deleteNotification(
      Number(notificationId)
    );
    return { success };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false };
  }
};

// ----------------- PUSH NOTIFICATIONS -----------------

export const sendRequestNotificationToRecipients = async (
  placeId: string,
  placeName: string,
  placeLocation: { latitude: number; longitude: number },
  senderToken: string
): Promise<boolean> => {
  try {
    const userId = useUserStore.getState().getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await notificationService.sendRequestNotification({
      placeId, // Google Place ID is string
      placeName,
      placeLocation,
      senderToken,
      senderId: Number(userId),
    });

    // console.log('[sendRequestNotification] Response:', response);
    return response?.success || false;
  } catch (error) {
    console.error('Error sending request notification:', error);
    return false;
  }
};

// FE service
export const sendResponseNotificationToRecipients = async (
  placeId: string,
  senderToken: string,
  postId: string
): Promise<boolean> => {
  try {
    const userId = useUserStore.getState().getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await notificationService.sendResponseNotification({
      placeId, // Google Place ID is string
      senderToken,
      postId: Number(postId),
      userId: Number(userId),
    });

    // console.log('[sendResponseNotification] Response:', response);
    return response?.success || false;
  } catch (error) {
    console.error('Error sending response notification:', error);
    return false;
  }
};
