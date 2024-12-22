import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { NavigationProp } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { setUser } from '../../../utils/services/functions';
import { registerForPushNotificationsAsync } from '../../../utils/services/notofications-handler';
import { openCamera } from '../../../utils/helper-functions/openCamera';

interface NotificationHandlerProps {
  navigation: NavigationProp<UserStackList>;
  userData: any;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  navigation,
  userData,
}) => {
  const { t } = useTranslation();
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
      Notifications.addNotificationReceivedListener(notification => {
        console.log(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const { placeId, senderToken, notificationTTL, sentAt } =
          response.notification.request.content.data;
        if (new Date().getTime() > sentAt + notificationTTL) {
          Alert.alert(t('request-expired'), t('missed-request-info'));
        } else {
          openCamera(placeId, senderToken, navigation);
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
