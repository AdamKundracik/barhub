import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { useTranslation } from 'react-i18next';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

const { width } = Dimensions.get('window');

type SlidingViewProps = {
  visible: boolean;
  onClose: () => void;
  openGallery: () => void;
  openCamera: () => void;
  removePicture: () => void;
  isOpeningGallery?: boolean;
  isOpeningCamera?: boolean;
  isDeletingPhoto?: boolean;
};

export const SlidingView = ({
  visible,
  onClose,
  openGallery,
  openCamera,
  removePicture,
  isOpeningGallery = false,
  isOpeningCamera = false,
  isDeletingPhoto = false,
}: SlidingViewProps) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['40%']}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: colors.bottomModalBgColor }}
      handleHeight={50}
      enablePanDownToClose
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.separatorColor }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.option, isOpeningGallery && styles.disabledOption]}
          onPress={openGallery}
          disabled={isOpeningGallery}
        >
          {isOpeningGallery ? (
            <ActivityIndicator size="small" color={colors.primaryTextColor} />
          ) : (
            <FontAwesomeIcon icon={Icons.Image} size={24} color={colors.primaryTextColor} />
          )}
          <Text style={[styles.text, { color: colors.primaryTextColor }]}>{t('pick-from-gallery')}</Text>
        </TouchableOpacity>
        <View style={[styles.separator, { backgroundColor: colors.separatorColor }]}></View>
        <TouchableOpacity
          style={[styles.option, isOpeningCamera && styles.disabledOption]}
          onPress={openCamera}
          disabled={isOpeningCamera}
        >
          {isOpeningCamera ? (
            <ActivityIndicator size="small" color={colors.primaryTextColor} />
          ) : (
            <FontAwesomeIcon icon={Icons.Camera} size={24} color={colors.primaryTextColor} />
          )}
          <Text style={[styles.text, { color: colors.primaryTextColor }]}>{t('take-new-picture')}</Text>
        </TouchableOpacity>
        <View style={[styles.separator, { backgroundColor: colors.separatorColor }]}></View>
        <TouchableOpacity
          style={[styles.option, isDeletingPhoto && styles.disabledOption]}
          onPress={removePicture}
          disabled={isDeletingPhoto}
        >
          {isDeletingPhoto ? (
            <ActivityIndicator size="small" color={colors.primaryTextColor} />
          ) : (
            <FontAwesomeIcon icon={Icons.Ban} size={24} color={colors.primaryTextColor} />
          )}
          <Text style={[styles.text, { color: colors.primaryTextColor }]}>{t('remove-picture')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  option: {
    paddingVertical: 20,
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  disabledOption: {
    opacity: 0.6,
  },
  separator: {
    height: 1,
    // backgroundColor is set inline to use theme colors
    marginVertical: 5,
  },
  text: {
    // color is set inline to use theme colors
    fontSize: 16,
    flexShrink: 1,
  },
  handleIndicator: {
    // backgroundColor is set inline to use theme colors
    width: '10%',
    margin: 5,
  },
  footerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    // color is set inline to use theme colors
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SlidingView;
