import * as admin from 'firebase-admin';

export type NotificationItem = {
  id: string;
  postId: string;
  label: string;
  text: string;
  creationTime: admin.firestore.Timestamp;
  userId: string;
  norificationType: NotificationType;
};

export enum NotificationType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
}

export interface SaveNotificationResponse extends NotificationItem {}

export interface SaveNotificationRequest extends NotificationItem {
  userId: string;
}

export interface GetUserNotificationsResponse {
  notifications: NotificationItem[];
  hasNewNotifications: boolean;
  newNotificationsCount: number;
}
