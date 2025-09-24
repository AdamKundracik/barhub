import * as admin from 'firebase-admin';

export type NotificationItem = {
  id: string;
  read: boolean;
  creationTime: admin.firestore.Timestamp;
  userId: string;
  senderId: string;
  notificationType: NotificationType;
  senderToken?: string;
  placeId?: string;
  postId?: string;
};

export enum NotificationType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
}

export interface SaveNotificationResponse extends NotificationItem {}

export interface SaveNotificationRequest extends NotificationItem {}

export interface GetUserNotificationsResponse {
  notifications: SaveNotificationResponse[];
  hasNewNotifications: boolean;
  newNotificationsCount: number;
}
