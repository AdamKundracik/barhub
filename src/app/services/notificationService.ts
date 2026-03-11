import { apiUtils } from '../utils/api/apiClient';
import { ENDPOINTS } from '../config/api';
import {
  CommentNotificationDTO,
  GetUserNotificationsResponseDTO,
  LikeNotificationDTO,
  NotificationDTO,
  RequestNotificationDTO,
  ResponseNotificationDTO,
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

  // Get notifications for a specific user
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
        hasNewNotifications: false,
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

  // Send like notification (matches backend LikeNotificationDTO)
  async sendLikeNotification(request: LikeNotificationDTO): Promise<boolean> {
    try {
      await apiUtils.post(`${ENDPOINTS.NOTIFICATIONS.BASE}/send-like`, request);
      return true;
    } catch (error) {
      console.error('Error sending like notification:', error);
      return false;
    }
  }

  // Send comment notification (matches backend CommentNotificationDTO)
  async sendCommentNotification(
    request: CommentNotificationDTO
  ): Promise<boolean> {
    try {
      await apiUtils.post(
        `${ENDPOINTS.NOTIFICATIONS.BASE}/send-comment`,
        request
      );
      return true;
    } catch (error) {
      console.error('Error sending comment notification:', error);
      return false;
    }
  }

  // Send request notification (matches backend RequestNotificationDTO)
  async sendRequestNotification(
    request: RequestNotificationDTO
  ): Promise<{ success: boolean; recipients: number[] }> {
    // Propagate error instead of returning null - let the caller handle it
    return await apiUtils.post<{
      success: boolean;
      recipients: number[];
    }>(`${ENDPOINTS.NOTIFICATIONS.BASE}/send-request`, request);
  }

  // Send response notification (matches backend ResponseNotificationDTO)
  async sendResponseNotification(
    request: ResponseNotificationDTO
  ): Promise<{ success: boolean; recipients: number[] } | null> {
    try {
      return await apiUtils.post<{
        success: boolean;
        recipients: number[];
      }>(`${ENDPOINTS.NOTIFICATIONS.BASE}/send-response`, request);
    } catch (error) {
      console.error('Error sending response notification:', error);
      return null;
    }
  }

  // Mark all notifications as seen
  async markAllAsSeen(
    userId: string
  ): Promise<{ success: boolean; updatedCount: number } | null> {
    try {
      return await apiUtils.patch<{
        success: boolean;
        updatedCount: number;
      }>(`${ENDPOINTS.NOTIFICATIONS.BASE}/user/${userId}/mark-all-seen`);
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
      return null;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<NotificationDTO | null> {
    try {
      return await apiUtils.patch<NotificationDTO>(
        `${ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}/read`
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      await apiUtils.delete(
        `${ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}`
      );
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
