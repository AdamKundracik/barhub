import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../utils/icons/icons';
import { primaryColor } from '../../../../utils/styles/colors';
import {
  NotificationItemProps,
  NotificationType,
} from '../../../../utils/types/notification-types';

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
    return new Date(timestamp._seconds * 1000).toLocaleDateString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.itemContainer}>
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
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.time}>{formatTime(item.creationTime)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default NotificationItemComponent;

const styles = StyleSheet.create({
  itemContainer: {
    position: 'relative',
    marginBottom: 12,
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
