import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

type BlockUserModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  userName?: string;
  isBlocked?: boolean; // true if user is already blocked (for unblock action)
};

export const BlockUserModal = ({
  visible,
  onClose,
  onConfirm,
  userName = 'Unknown User',
  isBlocked = false,
}: BlockUserModalProps) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [loading, setLoading] = useState(false);
  
  // Get screen height for responsive snap points
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const isSmallDevice = SCREEN_HEIGHT < 700;
  
  // Calculate dynamic snap points based on device size
  const snapPoints = isSmallDevice ? ['75%'] : ['60%'];

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const title = isBlocked
    ? t('blockUser.unblockTitle') || 'Unblock User'
    : t('blockUser.title') || 'Block User';

  const message = isBlocked
    ? t('blockUser.unblockMessage', { userName }) ||
      `Are you sure you want to unblock ${userName}? You will see their posts and they will be able to interact with your content again.`
    : t('blockUser.message', { userName }) ||
      `Are you sure you want to block ${userName}? You won't see their posts and they won't be able to interact with your content.`;

  const confirmText = isBlocked
    ? t('blockUser.unblock') || 'Unblock'
    : t('blockUser.block') || 'Block';

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={[styles.container, { backgroundColor: colors.bottomModalBgColor }]}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.separatorColor }]}
      enablePanDownToClose
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryTextColor + '1A' }]}>
          <FontAwesomeIcon
            icon={isBlocked ? Icons.CheckCircle : Icons.Ban}
            size={32}
            color={isBlocked ? colors.primaryTextColor : colors.warningColor}
          />
        </View>

        <Text style={[styles.title, { color: colors.primaryTextColor }]}>{title}</Text>

        <Text style={[styles.message, { color: colors.secondaryTextColor }]}>{message}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              isBlocked ? styles.unblockButton : styles.blockButton,
              { backgroundColor: isBlocked ? colors.successColor : colors.warningColor },
            ]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryBgColor} />
            ) : (
              <Text style={[styles.confirmButtonText, { color: colors.primaryBgColor }]}>{confirmText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              {
                backgroundColor: colors.primaryTextColor + '1A',
                borderColor: colors.primaryTextColor + '33',
              },
            ]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.primaryTextColor }]}>
              {t('cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor is set inline to use theme colors
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40, // Extra padding for small devices
    alignItems: 'center',
    flexGrow: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    // backgroundColor is set inline to use theme colors
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    // color is set inline to use theme colors
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    // color is set inline to use theme colors
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButton: {
    // backgroundColor is set inline to use theme colors
  },
  blockButton: {
    // backgroundColor is set inline to use theme colors
  },
  unblockButton: {
    // backgroundColor is set inline to use theme colors
  },
  confirmButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    // backgroundColor and borderColor are set inline to use theme colors
    borderWidth: 1,
  },
  cancelButtonText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '500',
  },
  handleIndicator: {
    // backgroundColor is set inline to use theme colors
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
});
