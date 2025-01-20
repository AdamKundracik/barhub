import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import React, { useMemo, useState, useRef } from 'react';
import { primaryBgColor, primaryColor } from '../../../utils/styles/colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { ScreenLayout } from '../../../components/user/Shared/ScreenLayout';

type Notification = {
  postId: string;
  label: string;
  text: string;
  creationTime: Timestamp;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -200;

const NotificationItem = ({
  item,
  onDelete,
}: {
  item: Notification;
  onDelete: () => void;
}) => {
  const position = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        // Only allow left swipe
        position.setValue(gesture.dx);
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < SWIPE_THRESHOLD) {
        Animated.timing(position, {
          toValue: -SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }).start(onDelete);
      } else {
        Animated.spring(position, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const getTransformStyle = () => {
    return {
      transform: [
        {
          translateX: position,
        },
      ],
    };
  };

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.notificationContainer}>
      <Animated.View
        style={[styles.notificationContent, getTransformStyle()]}
        {...panResponder.panHandlers}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.text}>{item.text}</Text>
          <Text style={styles.time}>{formatTime(item.creationTime)}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export const NotificationsList = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const [notifications, setNotifications] = useState(() => {
    const generatePostId = () => Math.random().toString(36).substring(2, 8);
    const generateRecentTimestamp = () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const randomTime =
        start.getTime() + Math.random() * (end.getTime() - start.getTime());
      return Timestamp.fromMillis(randomTime);
    };

    const notifs: Notification[] = [
      {
        postId: generatePostId(),
        text: 'New comment on your recent post',
        label: 'Comment Notification',
        creationTime: generateRecentTimestamp(),
      },
      {
        postId: generatePostId(),
        text: 'Your post has been trending in your area',
        label: 'Trending Alert',
        creationTime: generateRecentTimestamp(),
      },
      {
        postId: generatePostId(),
        text: 'Someone mentioned you in their post',
        label: 'Mention Alert',
        creationTime: generateRecentTimestamp(),
      },
      {
        postId: generatePostId(),
        text: 'Your post received 100+ likes',
        label: 'Achievement Notification',
        creationTime: generateRecentTimestamp(),
      },
    ].sort((a, b) => b.creationTime.seconds - a.creationTime.seconds);

    return notifs;
  });

  const handleDelete = (postId: string) => {
    setNotifications(prev => prev.filter(notif => notif.postId !== postId));
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem item={item} onDelete={() => handleDelete(item.postId)} />
  );

  return (
    <ScreenLayout title={'Notifications'} clickFunction={navigation.goBack}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.postId}
        contentContainerStyle={styles.listContainer}
        style={styles.flatList}
        showsVerticalScrollIndicator={false}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  mainContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  notificationContainer: {
    position: 'relative',
    height: 100, // Adjust based on your content
  },
  notificationContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    zIndex: 1,
    borderColor: primaryColor,
    borderWidth: 1,
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD * -1,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    color: 'white',
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
    color: 'white',
  },
  time: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default NotificationsList;
