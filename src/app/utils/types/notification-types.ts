import { Timestamp } from 'firebase/firestore';

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
  creationTime: Timestamp;
  userId: string;
  notificationType: NotificationType;
  senderToken?: string;
  placeId?: string;
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

export type AdminNotificationItem = Omit<NotificationItem, 'creationTime'> & {
  creationTime: FirebaseFirestore.Timestamp;
};

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
