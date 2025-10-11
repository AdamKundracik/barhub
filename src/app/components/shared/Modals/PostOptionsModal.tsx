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

type PostOptionsModalProps = {
  visible: boolean;
  showDelete?: boolean; // From backend canDelete permission
  showReport?: boolean; // From backend canReport permission
  showHighlight?: boolean; // From backend canHighlight permission
  isHighlighted?: boolean; // Current highlight state
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  onReport: () => void; // otvorí Report modal
  onHighlight?: () => void; // highlight/unhighlight post
  onShare?: () => void; // share post
};

export const PostOptionsModal = ({
  visible,
  onClose,
  onDelete,
  onReport,
  onHighlight,
  onShare,
  showDelete = false,
  showReport = true,
  showHighlight = false,
  isHighlighted = false,
}: PostOptionsModalProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['35%']}
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
              <Text style={[styles.optionText, { color: isHighlighted ? '#FFF' : '#FFC107' }]}>
                {isHighlighted ? t('unhighlight-post') : t('highlight-post')}
              </Text>
              <FontAwesomeIcon
                icon={Icons.RankingStar}
                size={16}
                color={isHighlighted ? '#FFF' : '#FFC107'}
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
              <Text style={styles.optionText}>{t('delete-post')}</Text>
              <FontAwesomeIcon icon={Icons.TrashCan} size={16} color="white" />
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
