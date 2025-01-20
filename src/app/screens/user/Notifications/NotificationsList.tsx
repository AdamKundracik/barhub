import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { primaryColor } from '../../../utils/styles/colors';
import { ScreenLayout } from '../../../components/user/Shared/ScreenLayout';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -150;

type Notification = {
  postId: string;
  label: string;
  text: string;
  creationTime: Timestamp;
};

interface NotificationItemProps {
  item: Notification;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onDelete,
  onSwipeStart,
  onSwipeEnd,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isDeleting = useRef(false);

  // Create interpolated value for delete icon opacity
  const deleteIconOpacity = translateX.interpolate({
    inputRange: [-150, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      onSwipeStart();
    },
    onPanResponderMove: (_, { dx }) => {
      if (dx < 0) translateX.setValue(dx);
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

  const formatTime = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.itemContainer}>
      {/* Delete icon container - positioned absolutely behind the notification */}
      <Animated.View
        style={[styles.deleteIconContainer, { opacity: deleteIconOpacity }]}
      >
        <FontAwesomeIcon icon={Icons.Remove} size={24} color="red" />
      </Animated.View>

      {/* Main notification content */}
      <Animated.View
        style={[styles.notificationItem, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.notificationContent}>
          <View style={styles.contentRow}>
            <View style={styles.iconContainer}>
              <FontAwesomeIcon
                icon={Icons.Bell}
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
      </Animated.View>
    </View>
  );
};

interface UndoMessageProps {
  onUndo: () => void;
  onHide: () => void;
}

const UndoMessage: React.FC<UndoMessageProps> = ({ onUndo, onHide }) => {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    const timer = setTimeout(() => {
      hide();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const hide = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(onHide);
  };

  const handleUndo = () => {
    onUndo();
    hide();
  };

  return (
    <Animated.View
      style={[styles.undoContainer, { transform: [{ translateY }] }]}
    >
      <Text style={styles.undoText}>Notification deleted</Text>
      <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
        <Text style={styles.undoButtonText}>UNDO</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const generateMockData = (): Notification[] => {
  const generatePostId = () => Math.random().toString(36).substring(2, 8);
  const generateTimestamp = () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    return Timestamp.fromDate(date);
  };

  return [
    {
      postId: generatePostId(),
      text: 'New comment on your recent post',
      label: 'Comment',
      creationTime: generateTimestamp(),
    },
    {
      postId: generatePostId(),
      text: 'Your post has been trending in your area',
      label: 'Trending',
      creationTime: generateTimestamp(),
    },
    {
      postId: generatePostId(),
      text: 'Someone mentioned you in their post',
      label: 'Mention',
      creationTime: generateTimestamp(),
    },
    {
      postId: generatePostId(),
      text: 'Your post received 100+ likes',
      label: 'Achievement',
      creationTime: generateTimestamp(),
    },
  ].sort((a, b) => b.creationTime.seconds - a.creationTime.seconds);
};

export const NotificationsList: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const [notifications, setNotifications] = useState(generateMockData);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [lastDeletedItem, setLastDeletedItem] = useState<Notification | null>(
    null
  );
  const [showUndo, setShowUndo] = useState(false);

  const handleDelete = (postId: string) => {
    const deletedItem = notifications.find(n => n.postId === postId);
    if (deletedItem) {
      setLastDeletedItem(deletedItem);
      setShowUndo(true);
    }
    setNotifications(current =>
      current.filter(notification => notification.postId !== postId)
    );
  };

  const handleUndo = () => {
    if (lastDeletedItem) {
      setNotifications(current =>
        [...current, lastDeletedItem].sort(
          (a, b) => b.creationTime.seconds - a.creationTime.seconds
        )
      );
      setLastDeletedItem(null);
    }
  };

  const handleUndoHide = () => {
    setShowUndo(false);
    setLastDeletedItem(null);
  };

  const handleSwipeStart = () => {
    setIsScrollEnabled(false);
  };

  const handleSwipeEnd = () => {
    setIsScrollEnabled(true);
  };

  return (
    <ScreenLayout
      title="Notifications"
      clickFunction={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <FlatList
          data={notifications}
          scrollEnabled={isScrollEnabled}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onDelete={() => handleDelete(item.postId)}
              onSwipeStart={handleSwipeStart}
              onSwipeEnd={handleSwipeEnd}
            />
          )}
          keyExtractor={item => item.postId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        {showUndo && (
          <UndoMessage onUndo={handleUndo} onHide={handleUndoHide} />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 100, // Extra padding for undo message
  },
  itemContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  deleteIconContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -12 }], // Half of icon size
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
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  undoText: {
    color: 'white',
    fontSize: 14,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoButtonText: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: '600',
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

export default NotificationsList;
