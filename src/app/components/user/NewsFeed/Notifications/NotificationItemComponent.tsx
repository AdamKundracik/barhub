import React, { useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useLocales } from 'expo-localization';
import { NotificationItemProps } from '@/src/app/utils/types/notification-types';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import {
  NotificationItem,
  NotificationType,
} from '@/common/types/notificationTypes';
import { Icons } from '@/src/app/utils/icons/icons';
import { openCamera } from '@/src/app/utils/helper-functions/openCamera';
import { primaryColor } from '@/src/app/utils/styles/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -150;

export const NotificationItemComponent: React.FC<NotificationItemProps> = ({
  item,
  onDelete,
  onSwipeStart,
  onSwipeEnd,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isDeleting = useRef(false);
  const gestureStartX = useRef(0);

  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const locales = useLocales();

  const getNotificationText = (notificationType: NotificationType) => {
    switch (notificationType) {
      case NotificationType.LIKE:
        return {
          label: t('new-like'),
          icon: Icons.HeartSolid,
        };
      case NotificationType.COMMENT:
        return {
          label: t('new-comment'),
          icon: Icons.CommentSolid,
        };
      case NotificationType.REQUEST:
        return {
          label: t('request'),
          icon: Icons.Bell,
        };
      case NotificationType.RESPONSE:
        return {
          label: t('response'),
          icon: Icons.Bell,
        };
      default:
        return {
          label: '',
          icon: Icons.Bell,
        };
    }
  };

  const notificationInfo = getNotificationText(item.notificationType);

  const deleteIconOpacity = translateX.interpolate({
    inputRange: [-150, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (_, { x0 }) => {
      gestureStartX.current = x0;
      return true;
    },
    onMoveShouldSetPanResponder: (_, { dx, dy }) => {
      const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
      const startedFromEdge = gestureStartX.current > SCREEN_WIDTH - 100;
      return isHorizontalSwipe && !startedFromEdge;
    },
    onPanResponderGrant: () => {
      onSwipeStart();
    },
    onPanResponderMove: (_, { dx }) => {
      const newX = Math.min(0, dx);
      translateX.setValue(newX);
    },
    onPanResponderRelease: (_, { dx }) => {
      if (dx < SWIPE_THRESHOLD && !isDeleting.current) {
        isDeleting.current = true;
        Animated.timing(translateX, {
          toValue: -SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDelete();
          isDeleting.current = false;
          onSwipeEnd();
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
        }).start(() => {
          onSwipeEnd();
        });
      }
    },
    onPanResponderTerminate: () => {
      onSwipeEnd();
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
      }).start();
    },
  });

  const formatTime = (timestamp: any) => {
    return new Date(timestamp._seconds * 1000).toLocaleDateString(
      locales[0]?.languageCode ?? 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  async function handleNotification(notification: NotificationItem) {
    try {
      const { placeId, notificationType, senderToken, creationTime, id } =
        notification;

      if (!creationTime || typeof creationTime !== 'object') {
        throw new Error('Creation time is missing or not an object');
      }

      if ('_seconds' in creationTime && '_nanoseconds' in creationTime) {
        const timestamp = (creationTime._seconds as number) * 1000;
        const expirationTime = 180 * 1000; // 3 minutes

        if (notificationType === NotificationType.REQUEST) {
          if (Date.now() > timestamp + expirationTime) {
            Alert.alert(t('request-expired'), t('missed-request-info'));
          } else {
            await openCamera(placeId, senderToken, navigation, id);
          }
        }
      } else {
        throw new Error('Invalid timestamp format');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      Alert.alert(t('error'), t('notification-processing-error'));
    }
  }

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleNotification(item)}
    >
      <Animated.View
        style={[styles.deleteIconContainer, { opacity: deleteIconOpacity }]}
      >
        <FontAwesomeIcon icon={Icons.Remove} size={24} color="red" />
      </Animated.View>
      {/*Deletion Animation temporarly disabled - <Animated.View
        style={[styles.notificationItem, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >*/}
      <View style={[styles.notificationItem]}>
        <View style={styles.notificationContent}>
          <View style={styles.contentRow}>
            <View style={styles.iconContainer}>
              <FontAwesomeIcon
                icon={
                  item.notificationType === NotificationType.LIKE
                    ? Icons.HeartSolid
                    : item.notificationType === NotificationType.COMMENT
                      ? Icons.CommentSolid
                      : Icons.Bell
                }
                size={20}
                color={primaryColor}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>{notificationInfo.label}</Text>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.time}>{formatTime(item.creationTime)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NotificationItemComponent;

const styles = StyleSheet.create({
  itemContainer: {
    position: 'relative',
  },
  deleteIconContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 1,
  },
  notificationItem: {
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    overflow: 'hidden',
    zIndex: 2,
  },
  notificationContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    alignSelf: 'center',
  },
  textContainer: {
    flex: 1,
  },
});
