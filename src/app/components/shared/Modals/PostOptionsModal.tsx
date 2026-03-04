import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import {
  bottomModalBgColor,
  warningColor,
} from '@/src/app/utils/styles/colors';
import {
  saveImageToGallery,
  showSaveResultAlert,
} from '@/src/app/utils/helper-functions/saveImageToGallery';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type PostOptionsModalProps = {
  visible: boolean;
  showDelete?: boolean;
  showReport?: boolean;
  showHighlight?: boolean;
  isHighlighted?: boolean;
  imageUrl?: string;
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  onReport: () => void;
  onHighlight?: () => void;
  onViewDetail?: () => void;
  onShare?: () => Promise<void> | void;
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [loading, setLoading] = useState(false);

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
      // enableDynamicSizing replaces the manual getSnapPoints() calculation.
      // That function was fragile — it hardcoded 800 as the assumed screen
      // height, meaning it would produce wrong percentages on any device
      // taller or shorter than 800px. Dynamic sizing measures the actual
      // rendered content instead, so it's always exactly right.
      enableDynamicSizing
      // Cap at 70% so the sheet never becomes taller than needed on large screens
      maxDynamicContentSize={SCREEN_HEIGHT * 0.7}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
    >
      {/*
        BottomSheetView (not ScrollView) is correct here — this is a fixed
        list of options with no text input, so there's no keyboard to handle
        and no overflow to scroll. Dynamic sizing will fit it exactly.
      */}
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
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>{t('view-post-detail')}</Text>
              <FontAwesomeIcon icon={Icons.Info} size={16} color="white" />
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
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>{t('share-post')}</Text>
              <FontAwesomeIcon icon={Icons.Share} size={16} color="white" />
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
              <FontAwesomeIcon
                icon={Icons.TrashCan}
                size={16}
                color={warningColor}
              />
            </View>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </BottomSheetView>
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
    paddingBottom: 32,
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
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
