import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { UserStackList } from '../../../utils/types/screen-types';
import { setUser } from '../../../utils/services/functions';
import { registerForPushNotificationsAsync } from '../../../utils/functions/notofications-handler';
import { openCamera } from '../../../utils/helper-functions/openCamera';
import { saveNotification } from '../../../utils/services/notifications-service';
import { NavigationProp } from '@react-navigation/native';
import { NotificationType } from '../../../utils/types/notification-types';
import { useNotificationsStore } from '../../../utils/store/notificationsStore';

interface NotificationHandlerProps {
  navigation: NavigationProp<UserStackList>;
  userData: any;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const { refetch } = useNotificationsStore();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    const setTokenToDatabase = async (pushToken: string) => {
      await setUser({ pushToken: pushToken });
    };

    registerForPushNotificationsAsync()
      .then(token => {
        setExpoPushToken(token ?? '');
        setTokenToDatabase(token ?? '');
      })
      .catch(error => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener(async notification => {
        const { notificationType, placeId, senderToken } =
          notification.request.content.data;
        await saveNotification({
          label: notification.request.content.title ?? 'No title text',
          text: notification.request.content.body ?? 'no body text',
          notificationType: notificationType,
          placeId: placeId,
          senderToken: senderToken,
        });
        await refetch();
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(async response => {
        const {
          placeId,
          senderToken,
          notificationTTL,
          sentAt,
          notificationType,
        } = response.notification.request.content.data;

        switch (notificationType as NotificationType) {
          case NotificationType.LIKE:
            navigation.navigate('NotificationsList');
            break;
          case NotificationType.COMMENT:
            navigation.navigate('NotificationsList');
            break;
          case NotificationType.REQUEST:
            if (
              new Date().getTime() >
              new Date(sentAt).getTime() + notificationTTL
            ) {
              Alert.alert(t('request-expired'), t('missed-request-info'));
            } else {
              await openCamera(placeId, senderToken, navigation);
            }
            break;
          case NotificationType.RESPONSE:
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  return null;
};

export default NotificationHandler;
