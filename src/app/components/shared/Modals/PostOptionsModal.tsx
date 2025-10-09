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
  BottomSheetFooter,
  BottomSheetFooterProps,
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
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  onReport: () => void; // otvorí Report modal
  onHighlight?: () => void; // highlight/unhighlight post
};

export const PostOptionsModal = ({
  visible,
  onClose,
  onDelete,
  onReport,
  onHighlight,
  showDelete = false,
  showReport = true,
  showHighlight = false,
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

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom + 20}>
        <View style={styles.cancelContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    [loading]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['35%']}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.container}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
      footerComponent={renderFooter}
    >
      <BottomSheetView style={styles.content}>
        {showHighlight && onHighlight && (
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={onHighlight}
            disabled={loading}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: '#FFC107' }]}>
                {t('highlight-post') || 'Highlight Post'}
              </Text>
              <FontAwesomeIcon icon={Icons.RankingStar} size={16} color="#FFC107" />
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
              <FontAwesomeIcon icon={Icons.Flag} size={16} color={warningColor} />
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
