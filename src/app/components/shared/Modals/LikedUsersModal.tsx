import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  bottomModalBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';

export interface LikedUser {
  id: number;
  name: string;
  photoUrl: string;
  role: string;
}

type LikedUsersModalProps = {
  visible: boolean;
  onClose: () => void;
  users: LikedUser[];
  onUserPress: (userId: number) => void;
  loading?: boolean;
};

export const LikedUsersModal = ({
  visible,
  onClose,
  users,
  onUserPress,
  loading = false,
}: LikedUsersModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

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

  const renderUserItem = ({ item }: { item: LikedUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        onUserPress(item.id);
        onClose();
      }}
    >
      <Avatar size="md" style={styles.avatar}>
        {item.photoUrl ? (
          <AvatarImage source={{ uri: item.photoUrl }} />
        ) : (
          <AvatarFallbackText className="text-white">
            {item.name}
          </AvatarFallbackText>
        )}
      </Avatar>
      <Text style={styles.username}>{item.name}</Text>
      <FontAwesomeIcon
        icon={Icons.ChevronRight}
        size={16}
        color={secondaryTextColor}
      />
    </TouchableOpacity>
  );

  const getSnapPoints = () => {
    // Menší default snap point s možnosťou rozšírenia
    return ['40%', '80%'];
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={getSnapPoints()}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: bottomModalBgColor }}
      handleHeight={50}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <FontAwesomeIcon
              icon={Icons.HeartSolid}
              size={20}
              color="#FF6B6B"
            />
            <Text style={styles.headerTitle}>
              {t('liked-by') || 'Liked by'}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{users.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>
              {t('cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>
              {t('loading') || 'Loading...'}
            </Text>
          </View>
        ) : users.length > 0 ? (
          <FlashList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={item => item.id.toString()}
            style={styles.usersList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersListContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon
              icon={Icons.Heart}
              size={48}
              color={secondaryTextColor}
            />
            <Text style={styles.emptyText}>
              {t('no-likes-yet') || 'No likes yet'}
            </Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: primaryTextColor,
    marginLeft: 8,
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: secondaryTextColor,
  },
  usersList: {
    flex: 1,
    marginTop: 16,
  },
  usersListContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: primaryTextColor,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    height: 150,
  },
  emptyText: {
    fontSize: 16,
    color: primaryTextColor,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    height: 150,
  },
  loadingText: {
    fontSize: 16,
    color: secondaryTextColor,
    marginTop: 12,
    textAlign: 'center',
  },
});
