import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

interface UndoMessageProps {
  onUndo: () => void;
  onHide: () => void;
}

export const UndoMessage: React.FC<UndoMessageProps> = ({ onUndo, onHide }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const { t } = useTranslation();
  const colors = useThemeColors();

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
      style={[
        styles.undoContainer,
        {
          transform: [{ translateY }],
          backgroundColor: colors.postBgColor,
          shadowColor: colors.primaryTextColor,
        },
      ]}
    >
      <Text style={[styles.undoText, { color: colors.primaryTextColor }]}>
        {t('notification-deleted')}
      </Text>
      <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
        <Text style={[styles.undoButtonText, { color: colors.primaryColor }]}>
          {t('undo')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 100,
  },
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
    // color is set inline to use theme colors
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    // color is set inline to use theme colors
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    // color is set inline to use theme colors
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
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    // backgroundColor and shadowColor are set inline to use theme colors
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  undoText: {
    // color is set inline to use theme colors
    fontSize: 14,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoButtonText: {
    // color is set inline to use theme colors
    fontSize: 14,
    fontWeight: '600',
  },
});
