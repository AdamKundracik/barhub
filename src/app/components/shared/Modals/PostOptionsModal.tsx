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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  bottomModalBgColor,
  warningColor,
} from '@/src/app/utils/styles/colors';
import { saveImageToGallery, showSaveResultAlert } from '@/src/app/utils/helper-functions/saveImageToGallery';

type PostOptionsModalProps = {
  visible: boolean;
  showDelete?: boolean; // From backend canDelete permission
  showReport?: boolean; // From backend canReport permission
  showReportUser?: boolean; // From backend canReportUser permission
  showHighlight?: boolean; // From backend canHighlight permission
  isHighlighted?: boolean; // Current highlight state
  imageUrl?: string; // URL of the post image for saving
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  onReport: () => void; // otvorí Report modal
  onReportUser?: () => void; // otvorí User Report modal
  onHighlight?: () => void; // highlight/unhighlight post
  onShare?: () => void; // share post
};

export const PostOptionsModal = ({
  visible,
  onClose,
  onDelete,
  onReport,
  onReportUser,
  onHighlight,
  onShare,
  imageUrl,
  showDelete = false,
  showReport = true,
  showReportUser = false,
  showHighlight = false,
  isHighlighted = false,
}: PostOptionsModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // Calculate number of visible options
  const getVisibleOptionsCount = useCallback(() => {
    let count = 0;
    if (onShare) count++;
    if (imageUrl) count++;
    if (showHighlight && onHighlight) count++;
    if (showDelete) count++;
    if (showReport) count++;
    if (showReportUser && onReportUser) count++;
    return count;
  }, [onShare, imageUrl, showHighlight, onHighlight, showDelete, showReport, showReportUser, onReportUser]);

  // Calculate dynamic snap points based on number of options
  const getSnapPoints = useCallback(() => {
    const optionCount = getVisibleOptionsCount();
    const baseHeight = 60; // Base height for handle and padding
    const optionHeight = 60; // Height per option
    const totalHeight = baseHeight + (optionCount * optionHeight);
    const screenHeight = 100; // Percentage of screen height
    const calculatedPercentage = Math.min(Math.max((totalHeight / 800) * 100, 25), 70); // Min 25%, Max 70%
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
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.content}>
        {onShare && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => {
              onShare();
              onClose();
            }}
            disabled={loading}
          >
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>{t('share-post')}</Text>
              <FontAwesomeIcon icon={Icons.Share} size={16} color="white" />
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
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>{t('save-to-gallery')}</Text>
              <FontAwesomeIcon icon={Icons.Download} size={16} color="white" />
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
              <Text style={[styles.optionText, { color: isHighlighted ? '#AAA' : '#FFC107' }]}>
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

        {showDelete && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={handleDelete}
            disabled={loading}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: warningColor }]}>
                {t('delete-post')}
              </Text>
              <FontAwesomeIcon icon={Icons.TrashCan} size={16} color={warningColor} />
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
              <Text style={[styles.optionText, { color: warningColor }]}>
                {t('reportPost.title')}
              </Text>
              <FontAwesomeIcon
                icon={Icons.Flag}
                size={16}
                color={warningColor}
              />
            </View>
          </TouchableOpacity>
        )}

        {showReportUser && onReportUser && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={onReportUser}
            disabled={loading}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: warningColor }]}>
                {t('reportUser.title')}
              </Text>
              <FontAwesomeIcon
                icon={Icons.Flag}
                size={16}
                color={warningColor}
              />
            </View>
          </TouchableOpacity>
        )}
      </BottomSheetView>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
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
    paddingHorizontal: 16,
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: {
    color: 'white',
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
