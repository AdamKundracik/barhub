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
import {
  bottomModalBgColor,
  primaryTextColor,
  secondaryTextColor,
  warningColor,
} from '@/src/app/utils/styles/colors';

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
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
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
        <View style={styles.iconContainer}>
          <FontAwesomeIcon
            icon={isBlocked ? Icons.CheckCircle : Icons.Ban}
            size={32}
            color={isBlocked ? primaryTextColor : warningColor}
          />
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              isBlocked ? styles.unblockButton : styles.blockButton,
            ]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
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
    backgroundColor: bottomModalBgColor,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: primaryTextColor,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: secondaryTextColor,
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
    backgroundColor: warningColor,
  },
  blockButton: {
    backgroundColor: '#FF3B30', // Red for block action
  },
  unblockButton: {
    backgroundColor: '#34C759', // Green for unblock action
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: primaryTextColor,
    fontSize: 16,
    fontWeight: '500',
  },
  handleIndicator: {
    backgroundColor: '#444',
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
});
