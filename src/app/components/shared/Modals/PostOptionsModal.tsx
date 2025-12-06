import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';
import {
  saveImageToGallery,
  showSaveResultAlert,
} from '@/src/app/utils/helper-functions/saveImageToGallery';

type PostOptionsModalProps = {
  visible: boolean;
  showDelete?: boolean; // From backend canDelete permission
  showReport?: boolean; // From backend canReport permission
  showHighlight?: boolean; // From backend canHighlight permission
  isHighlighted?: boolean; // Current highlight state
  imageUrl?: string; // URL of the post image for saving
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  onReport: () => void; // otvorí Report modal
  onHighlight?: () => void; // highlight/unhighlight post
  onViewDetail?: () => void; // zobrazí detail príspevku
  onShare?: () => Promise<void> | void; // share post
};

export const PostOptionsModal = ({
  visible,
  onClose,
  onDelete,
  onReport,
  onHighlight,
  onViewDetail,
  onShare,
  imageUrl,
  showDelete = false,
  showReport = true,
  showHighlight = false,
  isHighlighted = false,
}: PostOptionsModalProps) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [loading, setLoading] = useState(false);

  // Calculate number of visible options
  const getVisibleOptionsCount = useCallback(() => {
    let count = 0;
    if (imageUrl) count++;
    if (showHighlight && onHighlight) count++;
    if (showDelete) count++;
    if (showReport) count++;
    if (onViewDetail) count++;
    if (onShare) count++;
    return count;
  }, [
    imageUrl,
    showHighlight,
    onHighlight,
    showDelete,
    showReport,
    onViewDetail,
    onShare,
  ]);

  // Calculate dynamic snap points based on number of options
  const getSnapPoints = useCallback(() => {
    const optionCount = getVisibleOptionsCount();
    const baseHeight = 60; // Base height for handle and padding
    const optionHeight = 60; // Height per option
    const totalHeight = baseHeight + optionCount * optionHeight;
    const calculatedPercentage = Math.min(
      Math.max((totalHeight / 800) * 100, 25),
      70
    ); // Min 25%, Max 70%
    return [`${calculatedPercentage}%`];
  }, [getVisibleOptionsCount]);

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

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleSaveToGallery = async () => {
    if (!imageUrl) return;

    try {
      setLoading(true);
      const result = await saveImageToGallery(imageUrl);
      showSaveResultAlert(result, t);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={getSnapPoints()}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={[styles.container, { backgroundColor: colors.bottomModalBgColor }]}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.separatorColor }]}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.content}>
        {onViewDetail && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => {
              onViewDetail();
              onClose();
            }}
            disabled={loading}
          >
            <View style={[styles.optionRow, { borderBottomColor: colors.separatorColor }]}>
              <Text style={[styles.optionText, { color: colors.primaryTextColor }]}>{t('view-post-detail')}</Text>
              <FontAwesomeIcon icon={Icons.Info} size={16} color={colors.primaryTextColor} />
            </View>
          </TouchableOpacity>
        )}


        {imageUrl && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={handleSaveToGallery}
            disabled={loading}
          >
            <View style={[styles.optionRow, { borderBottomColor: colors.separatorColor }]}>
              <Text style={[styles.optionText, { color: colors.primaryTextColor }]}>{t('save-to-gallery')}</Text>
              <FontAwesomeIcon icon={Icons.Download} size={16} color={colors.primaryTextColor} />
            </View>
          </TouchableOpacity>
        )}

        {showHighlight && onHighlight && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => {
              onHighlight();
              onClose();
            }}
            disabled={loading}
          >
            <View style={styles.optionRow}>
              <Text
                style={[
                  styles.optionText,
                  { color: isHighlighted ? '#AAA' : '#FFC107' },
                ]}
              >
                {isHighlighted ? t('unhighlight-post') : t('highlight-post')}
              </Text>
              <FontAwesomeIcon
                icon={Icons.Bolt}
                size={16}
                color={isHighlighted ? '#AAA' : '#FFC107'}
              />
            </View>
          </TouchableOpacity>
        )}

        {onShare && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={async () => {
              await onShare();
              onClose();
            }}
            disabled={loading}
          >
            <View style={[styles.optionRow, { borderBottomColor: colors.separatorColor }]}>
              <Text style={[styles.optionText, { color: colors.primaryTextColor }]}>{t('share-post')}</Text>
              <FontAwesomeIcon icon={Icons.Share} size={16} color={colors.primaryTextColor} />
            </View>
          </TouchableOpacity>
        )}

        {showDelete && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={handleDelete}
            disabled={loading}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: colors.warningColor }]}>
                {t('delete-post')}
              </Text>
              <FontAwesomeIcon
                icon={Icons.TrashCan}
                size={16}
                color={colors.warningColor}
              />
            </View>
          </TouchableOpacity>
        )}

        {showReport && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={onReport}
            disabled={loading}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: colors.warningColor }]}>
                {t('reportPost.title')}
              </Text>
              <FontAwesomeIcon
                icon={Icons.Flag}
                size={16}
                color={colors.warningColor}
              />
            </View>
          </TouchableOpacity>
        )}
      </BottomSheetView>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primaryTextColor} />
        </View>
      )}
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
    paddingHorizontal: 16,
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor is set inline to use theme colors
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: {
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
  cancelContainer: {
    paddingHorizontal: 20,
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#222',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
