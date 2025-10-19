import { ClientDTO } from '@/src/app/types/dto';

export enum NotificationType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
}

export interface NotificationItem {
  id: string;
  postId: string;
  label: string;
  text: string;
  creationTime: string; // LocalDateTime from backend: "2025-10-07T22:29:23.517475"
  userId: string;
  notificationType: NotificationType;
  senderToken?: string;
  placeId?: string;
  sender?: ClientDTO; // Full sender user object from backend
  senderName: string;
  senderId?: string;
  read: boolean;
}

export interface NotificationItemProps {
  item: NotificationItem;
  // onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
  isBeingSwiped?: boolean;
}

export interface GetUserNotificationsResponse {
  notifications: NotificationItem[];
  hasNewNotifications: boolean;
  newNotificationsCount: number;
}

export interface GetNotificationsResult {
  data: GetUserNotificationsResponse;
}

export interface MarkNotificationReadResult {
  success: boolean;
  updatedCount: number;
}

export interface SaveNotificationRequest extends NotificationItem {}

export interface SaveNotificationResponse extends NotificationItem {}

export interface LikeNotificationRequest {
  expoPushToken: string;
  username: string;
  postId: string;
}

export interface CommentNotificationRequest {
  expoPushToken: string;
  username: string;
  postId: string;
  commentText: string;
}
