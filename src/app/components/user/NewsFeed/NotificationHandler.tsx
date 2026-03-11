import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../../utils/functions/notofications-handler';
import { openCamera } from '../../../utils/helper-functions/openCamera';
import { NotificationType } from '../../../utils/types/notification-types';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { userService } from '@/src/app/services/userService';
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
  const processingNotification = useRef<string | null>(null);
  const { setCurrentPushToken } = useUserStore();
  const { refetch } = useNotificationsQuery();

  const addPushToken = async (token: string) => {
    if (!token) return;
    const { getUserId } = useUserStore.getState();
    const userId = getUserId();
    if (!userId) return;

    const success = await userService.addPushToken(userId.toString(), token);
    if (success) setCurrentPushToken(token);
  };

  const removePushToken = async (token: string) => {
    if (!token) return;
    const { getUserId } = useUserStore.getState();
    const userId = getUserId();
    if (!userId) return;

    await userService.removePushToken(userId.toString(), token);
  };

  const unsubscribeNotifications = () => {
    // Odstránime iba listenerov, push token zostáva
    notificationListener.current?.remove();
    responseListener.current?.remove();
    notificationListener.current = null;
    responseListener.current = null;
  };

  useEffect(() => {
    // Získanie expo push tokenu - iba ak používateľ ešte nemá push token
    const { currentPushToken } = useUserStore.getState();
    if (currentPushToken) {
      // Používateľ už má push token, použijeme existujúci
      setExpoPushToken(currentPushToken);
    } else {
      // Používateľ nemá push token, získame nový
      registerForPushNotificationsAsync()
        .then(token => {
          setExpoPushToken(token ?? '');
          addPushToken(token ?? '');
        })
        .catch(error => setExpoPushToken(`${error}`));
    }

    // Listener pre prijaté notifikácie
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async () => {
        try {
          await refetch();
        } catch (error) {}
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
          postId,
        } = response.notification.request.content.data as {
          placeId: string;
          senderToken: string;
          notificationTTL: number;
          sentAt: string;
          notificationType: string;
          id: string;
          postId?: string;
        };

        // Prevent duplicate processing of the same notification
        const notificationKey = `${id}-${notificationType}`;
        if (processingNotification.current === notificationKey) {
          return;
        }

        processingNotification.current = notificationKey;

        // Reset after 2 seconds to allow retry if needed
        setTimeout(() => {
          processingNotification.current = null;
        }, 2000);

        switch (notificationType as NotificationType) {
          case NotificationType.LIKE:
            // Navigate to PostDetail if postId is available
            if (postId) {
              navigation.navigate('PostDetail', { postId });
            } else {
              navigation.navigate('NotificationsList');
            }
            break;
          case NotificationType.COMMENT:
            // Navigate to PostDetail with openComments flag for comment notifications
            if (postId) {
              navigation.navigate('PostDetail', { postId, openComments: true });
            } else {
              navigation.navigate('NotificationsList');
            }
            break;

          case NotificationType.REQUEST:
            // Check if elapsed time is less than 3 minutes (180 seconds)
            const elapsedTime =
              new Date().getTime() - new Date(sentAt).getTime();
            const threeMinutesInMs = 3 * 60 * 1000; // 3 minutes in milliseconds

            if (elapsedTime >= threeMinutesInMs) {
              Alert.alert(t('request-expired'), t('missed-request-info'));
            } else {
              await openCamera(placeId, senderToken, navigation, id);
            }
            break;

          case NotificationType.RESPONSE:
            // Navigate to PostDetail if postId is available
            if (postId) {
              navigation.navigate('PostDetail', { postId });
            } else {
              navigation.navigate('NotificationsList');
            }
            break;
        }
      });

    return () => {
      unsubscribeNotifications(); // iba cleanup listenerov
    };
  }, [refetch, navigation, t]);

  return { expoPushToken, unsubscribeNotifications, removePushToken };
}
