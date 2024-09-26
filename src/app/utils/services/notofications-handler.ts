import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function sendPushNotification(
  expoPushTokenRecipient: string,
  placeId: string,
  placeName: string,
  senderToken: string,
  notificationTTL: number = 180 * 1000 //measured in miliseconds (1s = 1000ms) - 3min default
) {
  const message = {
    to: expoPushTokenRecipient,
    sound: 'default',
    title: `${placeName} photo request!`,
    body: 'Will you show him how it looks inside?',
    data: {
      placeId: placeId,
      senderToken: senderToken,
      notificationTTL: notificationTTL,
      sentAt: new Date().getTime(),
    },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

export async function sendPushNotificationResponse(
  expoPushTokenRecipient: string,
  placeId: string
) {
  const message = {
    to: expoPushTokenRecipient,
    sound: 'default',
    title: 'Someone posted photo from requested place!',
    body: 'Check out how it looks inside!',
    data: { placeId: placeId },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

export function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    handleRegistrationError(
      'Permission not granted to get push token for push notification!'
    );
    return;
  }
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError('Project ID not found');
  }
  try {
    let pushTokenString: string;
    if (Platform.OS === 'ios') {
      pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants?.expoConfig?.extra?.eas.projectId,
        })
      ).data;
    } else {
      pushTokenString = (await Notifications.getDevicePushTokenAsync()).data;
    }
    return pushTokenString;
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
  }
}
