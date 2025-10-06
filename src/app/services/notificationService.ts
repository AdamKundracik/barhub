import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  CommentRequestDTO,
  CommentResponseDTO,
  GetUserNotificationsResponseDTO,
  NotificationDTO,
} from '../types/dto';

class NotificationService {
  // Get all notifications
  async getAllNotifications(): Promise<NotificationDTO[]> {
    try {
      return await apiUtils.get<NotificationDTO[]>(
        ENDPOINTS.NOTIFICATIONS.BASE
      );
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      return [];
    }
  }

  // Get notifications for specific user
  async getUserNotifications(
    userId: string
  ): Promise<GetUserNotificationsResponseDTO> {
    try {
      return await apiUtils.get<GetUserNotificationsResponseDTO>(
        ENDPOINTS.NOTIFICATIONS.BY_USER(userId)
      );
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return {
        notifications: [],
        newNotificationsCount: 0,
      };
    }
  }

  // Check if user has new notifications
  async hasNewNotifications(userId: string): Promise<boolean> {
    try {
      const response = await apiUtils.get<{ hasNew: boolean }>(
        ENDPOINTS.NOTIFICATIONS.HAS_NEW(userId)
      );
      return response.hasNew;
    } catch (error) {
      console.error('Error checking new notifications:', error);
      return false;
    }
  }

  // Get notifications count for user
  async getNotificationsCount(userId: string): Promise<number> {
    try {
      const response = await apiUtils.get<{ count: number }>(
        ENDPOINTS.NOTIFICATIONS.COUNT(userId)
      );
      return response.count;
    } catch (error) {
      console.error('Error fetching notifications count:', error);
      return 0;
    }
  }

  // Get notification by ID
  async getNotificationById(
    notificationId: string
  ): Promise<NotificationDTO | null> {
    try {
      return await apiUtils.get<NotificationDTO>(
        `${ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}`
      );
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      return null;
    }
  }

  // Create new notification
  async createNotification(
    notification: Partial<NotificationDTO>
  ): Promise<NotificationDTO | null> {
    try {
      return await apiUtils.post<NotificationDTO>(
        ENDPOINTS.NOTIFICATIONS.BASE,
        notification
      );
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Send like notification
  async sendLikeNotification(
    postId: string,
    likerUserId: string,
    postAuthorUserId: string
  ): Promise<boolean> {
    try {
      await apiUtils.post(`${ENDPOINTS.NOTIFICATIONS.BASE}/send-like`, {
        postId,
        likerUserId,
        postAuthorUserId,
      });
      return true;
    } catch (error) {
      console.error('Error sending like notification:', error);
      return false;
    }
  }

  // Send comment notification
  async sendCommentNotification(
    request: CommentRequestDTO
  ): Promise<CommentResponseDTO | null> {
    try {
      return await apiUtils.post<CommentResponseDTO>(
        `${ENDPOINTS.NOTIFICATIONS.BASE}/send-comment`,
        request
      );
    } catch (error) {
      console.error('Error sending comment notification:', error);
      return null;
    }
  }

  // Send request notification
  async sendRequestNotification(
    fromUserId: string,
    toUserId: string,
    message: string
  ): Promise<boolean> {
    try {
      await apiUtils.post(`${ENDPOINTS.NOTIFICATIONS.BASE}/send-request`, {
        fromUserId,
        toUserId,
        message,
      });
      return true;
    } catch (error) {
      console.error('Error sending request notification:', error);
      return false;
    }
  }

  // Send response notification
  async sendResponseNotification(
    fromUserId: string,
    toUserId: string,
    message: string,
    accepted: boolean
  ): Promise<boolean> {
    try {
      await apiUtils.post(`${ENDPOINTS.NOTIFICATIONS.BASE}/send-response`, {
        fromUserId,
        toUserId,
        message,
        accepted,
      });
      return true;
    } catch (error) {
      console.error('Error sending response notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
