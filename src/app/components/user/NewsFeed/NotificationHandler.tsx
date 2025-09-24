import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../../utils/functions/notofications-handler';
import { openCamera } from '../../../utils/helper-functions/openCamera';
import { NotificationType } from '../../../utils/types/notification-types';
import { useUserStore } from '@/src/app/utils/store/userStore';
import userClient from '@/src/app/utils/services/user.service';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import { useNotificationsQuery } from '@/src/app/utils/hooks/useNotifications';

export function useNotificationsHandler() {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { setCurrentPushToken } = useUserStore();
  const { refetch } = useNotificationsQuery();

  const addPushToken = async (token: string) => {
    if (!token) return;
    const response = await userClient.addPushToken(token);
    if (response.success) setCurrentPushToken(token);
  };

  const removePushToken = async (token: string) => {
    if (!token) return;
    await userClient.removePushToken(token);
  };

  const unsubscribeNotifications = () => {
    // Odstránime iba listenerov, push token zostáva
    notificationListener.current?.remove();
    responseListener.current?.remove();
    notificationListener.current = null;
    responseListener.current = null;
  };

  useEffect(() => {
    // Získanie expo push tokenu
    registerForPushNotificationsAsync()
      .then(token => {
        setExpoPushToken(token ?? '');
        addPushToken(token ?? '');
      })
      .catch(error => setExpoPushToken(`${error}`));

    // Listener pre prijaté notifikácie
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async () => {
        await refetch();
      });

    // Listener pre odpoveď na notifikácie
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(async response => {
        const {
          placeId,
          senderToken,
          notificationTTL,
          sentAt,
          notificationType,
          id,
        } = response.notification.request.content.data;

        switch (notificationType as NotificationType) {
          case NotificationType.LIKE:
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
              await openCamera(placeId, senderToken, navigation, id);
            }
            break;

          case NotificationType.RESPONSE:
            // prípadne spracovanie
            break;
        }
      });

    return () => {
      unsubscribeNotifications(); // iba cleanup listenerov
    };
  }, []);

  return { expoPushToken, unsubscribeNotifications, removePushToken };
}
