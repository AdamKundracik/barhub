import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../../utils/functions/notofications-handler';
import { useUserStore } from '@/src/app/utils/store/userStore';
import userClient from '@/src/app/utils/services/user.service';

export function useNotificationsHandler() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { setCurrentPushToken, currentPushToken } = useUserStore();

  const unsubscribeNotifications = async () => {
    notificationListener.current?.remove();
    responseListener.current?.remove();
    notificationListener.current = null;
    responseListener.current = null;

    await removePushToken(currentPushToken ?? expoPushToken);
    setExpoPushToken('');
  };

  const addPushToken = async (token: string) => {
    if (!token) return;
    const response = await userClient.addPushToken(token);
    if (response.success) setCurrentPushToken(token);
  };

  const removePushToken = async (token: string) => {
    if (!token) return;
    await userClient.removePushToken(token);
  };

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => {
        setExpoPushToken(token ?? '');
        addPushToken(token ?? '');
      })
      .catch(error => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Got notification', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response', response);
      });

    return () => {
      unsubscribeNotifications();
    };
  }, []);

  return { expoPushToken, unsubscribeNotifications };
}
