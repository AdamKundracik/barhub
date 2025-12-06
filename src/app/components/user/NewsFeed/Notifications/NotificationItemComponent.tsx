import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useLocales } from 'expo-localization';
import { BlurView } from 'expo-blur';

import { NotificationItemProps } from '@/src/app/utils/types/notification-types';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import { NotificationType } from '@/src/app/types/notificationTypes';
import { Icons } from '@/src/app/utils/icons/icons';
import { openCamera } from '@/src/app/utils/helper-functions/openCamera';
import {
  postBgColor,
  primaryColor,
  separatorColor,
  successColor,
  warningColor,
} from '@/src/app/utils/styles/colors';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = -120;

const NotificationItemComponent: React.FC<NotificationItemProps> = ({
  item,
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // console.log('[NotificationItemComponent] item.sender:', item.sender);

  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t, i18n } = useTranslation();
  const locales = useLocales();

  // --- ENHANCED TIME FORMATTING WITH AUTO-UPDATE ---
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for live time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const notificationConfig = useMemo(() => {
    // Use "Someone" if sender name is not available
    const senderName = item.sender?.name || t('someone');
    
    const configs = {
      [NotificationType.LIKE]: {
        label: t('new-like'),
        text: `${senderName} ${t('liked-your-photo')}`,
        icon: Icons.HeartSolid,
        color: '#FF6B85',
        bgGradient: ['rgba(255, 107, 133, 0.1)', 'rgba(255, 107, 133, 0.05)'],
        actionable: true,
      },
      [NotificationType.COMMENT]: {
        label: t('new-comment'),
        text: `${senderName} ${t('commented-your-photo')}`,
        icon: Icons.CommentSolid,
        color: '#4A90E2',
        bgGradient: ['rgba(74, 144, 226, 0.1)', 'rgba(74, 144, 226, 0.05)'],
        actionable: true,
      },
      [NotificationType.REQUEST]: {
        label: t('request'),
        text: `${senderName} ${t('sent-request')}`,
        icon: Icons.Bell,
        color: primaryColor,
        bgGradient: [`rgba(16, 217, 185, 0.15)`, `rgba(16, 217, 185, 0.08)`],
        actionable: true,
      },
      [NotificationType.RESPONSE]: {
        label: t('response'),
        text: `${senderName} ${t('responded-to-request')}`,
        icon: Icons.Bell,
        color: successColor,
        bgGradient: [`rgba(76, 175, 80, 0.1)`, `rgba(76, 175, 80, 0.05)`],
        actionable: true,
      },
    };

    return configs[item.notificationType] || configs[NotificationType.REQUEST];
  }, [item.notificationType, item.sender?.name, t]);

  // Format timestamp - same logic as UserLine
  const formattedTime = useMemo(() => {
    if (!item.creationTime) {
      return '';
    }

    try {
      // Parse LocalDateTime string: "2025-10-07T22:29:23.517475"
      // Backend sends UTC time but without 'Z' suffix, so we need to treat it as UTC
      let dateStr = item.creationTime.includes('T')
        ? item.creationTime
        : item.creationTime.replace(' ', 'T');

      // Add 'Z' suffix to indicate UTC time
      if (
        !dateStr.endsWith('Z') &&
        !dateStr.includes('+') &&
        !dateStr.includes('-', 10)
      ) {
        dateStr += 'Z';
      }

      const dateObj = new Date(dateStr);

      // Validate date
      if (isNaN(dateObj.getTime())) {
        return '';
      }

      // Calculate difference using current time (updates every minute)
      const diffInMinutes = Math.floor(
        (currentTime.getTime() - dateObj.getTime()) / (1000 * 60)
      );
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      // Ak je menej ako 1 deň, používaj relatívny čas
      if (diffInDays < 1) {
        if (diffInMinutes < 1) {
          return t('just-now') || 'práve teraz';
        } else if (diffInMinutes < 60) {
          // Special handling for Spanish, Slovak, and German - "hace/pred/vor X min" instead of "X min hace/dozadu/vor"
          if (i18n.language === 'es' || i18n.language === 'sk' || i18n.language === 'de') {
            return `${t('ago')} ${diffInMinutes} min`;
          }
          return `${diffInMinutes} min ${t('ago')}`;
        } else {
          // Special handling for Spanish, Slovak, and German - "hace/pred/vor Xh" instead of "Xh hace/dozadu/vor"
          if (i18n.language === 'es' || i18n.language === 'sk' || i18n.language === 'de') {
            return `${t('ago')} ${diffInHours}h`;
          }
          return `${diffInHours}h ${t('ago')}`;
        }
      }

      // Ak je viac ako 1 deň, zobraz dátum a čas v lokálnej časovej zóne
      const userLocale = locales[0]?.languageTag || 'en-US';

      const formattedDate = dateObj.toLocaleString(userLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return formattedDate;
    } catch (error) {
      console.error(
        'Error formatting notification time:',
        error,
        item.creationTime
      );
      return '';
    }
  }, [item.creationTime, currentTime, locales, t]);

  // Check if notification is expired (for requests)
  const isExpired = useMemo(() => {
    if (item.notificationType !== NotificationType.REQUEST) return false;

    if (!item.creationTime) return true;

    try {
      // Parse LocalDateTime string: "2025-10-07T22:29:23.517475"
      // Backend sends UTC time but without 'Z' suffix, so we need to treat it as UTC
      let dateStr = item.creationTime.includes('T')
        ? item.creationTime
        : item.creationTime.replace(' ', 'T');

      // Add 'Z' suffix to indicate UTC time
      if (
        !dateStr.endsWith('Z') &&
        !dateStr.includes('+') &&
        !dateStr.includes('-', 10)
      ) {
        dateStr += 'Z';
      }

      const dateObj = new Date(dateStr);

      // Validate date
      if (isNaN(dateObj.getTime())) {
        return true;
      }

      const expirationTime = 180 * 1000; // 3 minutes
      return currentTime.getTime() > dateObj.getTime() + expirationTime;
    } catch (error) {
      console.error(
        'Error parsing notification time for expiration check:',
        error
      );
      return true;
    }
  }, [item.creationTime, item.notificationType, currentTime]);

  // Animation styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const deleteIconStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < SWIPE_THRESHOLD ? 1 : 0,
    transform: [{ scale: translateX.value < SWIPE_THRESHOLD ? 1 : 0.5 }],
  }));

  // Handle notification tap
  const handleNotificationPress = useCallback(async () => {
    if (!notificationConfig.actionable) return;

    // Add press animation
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });

    try {
      if (item.notificationType === NotificationType.REQUEST) {
        if (isExpired) {
          Alert.alert(t('request-expired'), t('missed-request-info'));
          return;
        }

        await openCamera(item.placeId, item.senderToken, navigation, item.id);
      } else if (
        item.notificationType === NotificationType.RESPONSE ||
        item.notificationType === NotificationType.LIKE ||
        item.notificationType === NotificationType.COMMENT
      ) {
        // Navigate to PostDetail for response/like/comment notifications
        if (item.postId) {
          (navigation as any).navigate('PostDetail', { postId: item.postId });
        }
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      Alert.alert(t('error'), t('notification-processing-error'));
    }
  }, [item, isExpired, notificationConfig.actionable, navigation, scale, t]);

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <Animated.View style={[styles.actionsContainer, deleteIconStyle]}>
        <View style={styles.actionButton}>
          <FontAwesomeIcon icon={Icons.Remove} size={20} color="white" />
        </View>
      </Animated.View>

      {/* Main Notification Item */}
      <Animated.View style={[styles.itemContainer, animatedContainerStyle]}>
        <Pressable
          style={({ pressed }) => [
            styles.pressableContainer,
            pressed && styles.pressablePressed,
          ]}
          onPress={handleNotificationPress}
          disabled={!notificationConfig.actionable}
        >
          <BlurView intensity={10} tint="dark" style={styles.blurContainer}>
            <View style={styles.contentContainer}>
              {/* Left Side - Icon */}
              <View style={styles.leftSection}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: notificationConfig.color + '20',
                      borderColor: notificationConfig.color + '40',
                    },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={notificationConfig.icon}
                    size={18}
                    color={notificationConfig.color}
                  />
                </View>

                {/* Unread Indicator */}
                {!item.read && <View style={styles.unreadDot} />}
              </View>

              {/* Center - Content */}
              <View style={styles.centerSection}>
                <View style={styles.headerRow}>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {notificationConfig.label}
                  </Text>

                  {isExpired && (
                    <View style={styles.expiredBadge}>
                      <Text style={styles.expiredText}>{t('expired')}</Text>
                    </View>
                  )}

                  {notificationConfig.actionable && !isExpired && (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionText}>
                        {item.notificationType === NotificationType.REQUEST
                          ? t('tap-to-respond')
                          : t('tap-to-view')}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.messageText} numberOfLines={2}>
                  {notificationConfig.text}
                </Text>

                <View style={styles.footerRow}>
                  <Text style={styles.timeText}>{formattedTime}</Text>
                </View>
              </View>

              {/* Right Side - Action Indicator */}
              {notificationConfig.actionable && !isExpired && (
                <View style={styles.rightSection}>
                  <FontAwesomeIcon
                    icon={Icons.ChevronRight}
                    size={12}
                    color={separatorColor}
                  />
                </View>
              )}
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 6,
  },

  // Background actions
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: warningColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: warningColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Main item
  itemContainer: {
    backgroundColor: postBgColor,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 2,
  },

  pressableContainer: {
    minHeight: 80,
  },

  pressablePressed: {
    opacity: 0.7,
  },

  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  // Left section
  leftSection: {
    position: 'relative',
    marginRight: 16,
    alignItems: 'center',
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },

  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: primaryColor,
    borderWidth: 2,
    borderColor: postBgColor,
  },

  // Center section
  centerSection: {
    flex: 1,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  labelText: {
    color: primaryColor,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },

  expiredBadge: {
    backgroundColor: 'rgba(254, 120, 120, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(254, 120, 120, 0.3)',
  },

  expiredText: {
    color: warningColor,
    fontSize: 10,
    fontWeight: '600',
  },

  actionBadge: {
    backgroundColor: 'rgba(16, 217, 185, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 217, 185, 0.3)',
  },

  actionText: {
    color: primaryColor,
    fontSize: 10,
    fontWeight: '600',
  },

  messageText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 8,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeText: {
    color: separatorColor,
    fontSize: 12,
    fontWeight: '500',
  },

  locationIndicator: {
    marginLeft: 8,
  },

  // Right section
  rightSection: {
    marginLeft: 12,
    opacity: 0.6,
  },
});

export default NotificationItemComponent;
