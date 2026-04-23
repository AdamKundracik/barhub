import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
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

  const renderItem = useCallback(
    ({ item }: { item: LikedUser }) => (
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
    ),
    [onUserPress, onClose]
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <FontAwesomeIcon icon={Icons.HeartSolid} size={20} color="#FF6B6B" />
          <Text style={styles.headerTitle}>{t('liked-by') || 'Liked by'}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{users.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>{t('cancel') || 'Cancel'}</Text>
        </TouchableOpacity>
      </View>
    ),
    [t, users.length, onClose]
  );

  const ListEmpty = useCallback(
    () => (
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
    ),
    [t]
  );

  const ListLoading = useCallback(
    () => (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
      </View>
    ),
    [t]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['70%']}
      // enableDynamicSizing lets the sheet grow with content
      enableDynamicSizing
      // Cap the max height at 75% of the screen — beyond this it scrolls
      maxDynamicContentSize={66 * 3 + 90}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: bottomModalBgColor }}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
    >
      {/*
        BottomSheetFlatList must be a direct child of BottomSheetModal — no
        BottomSheetView wrapper. A BottomSheetView wrapper would block
        scrolling when the sheet hasn't been expanded to its maximum height.

        stickyHeaderIndices={[0]} keeps the header fixed while scrolling.

        With enableDynamicSizing + maxDynamicContentSize:
          - Sheet expands to fit content naturally
          - Once content exceeds maxDynamicContentSize, the list becomes scrollable
      */}
      <BottomSheetFlatList
        data={loading ? [] : users}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={loading ? ListLoading : ListEmpty}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    // backgroundColor is required for stickyHeaderIndices to look correct —
    // without it the list items show through the header while scrolling
    backgroundColor: bottomModalBgColor,
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
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: secondaryTextColor,
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: primaryTextColor,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: secondaryTextColor,
    marginTop: 12,
    textAlign: 'center',
  },
});
