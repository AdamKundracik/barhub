import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { useTranslation } from 'react-i18next';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { bottomModalBgColor } from '@/src/app/utils/styles/colors';

const { height: SCREEN_HEIGHT, width } = Dimensions.get('window');

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
      // enableDynamicSizing replaces the hardcoded snapPoints={['40%']} —
      // the sheet now sizes itself to exactly fit the 3 options
      enableDynamicSizing
      maxDynamicContentSize={SCREEN_HEIGHT * 0.5}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: bottomModalBgColor }}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
    >
      {/*
        BottomSheetView instead of plain ScrollView:
        - A native ScrollView inside a BottomSheetModal breaks gesture handling:
          the pan-to-dismiss gesture fights with the scroll gesture, causing
          erratic behaviour when trying to swipe the sheet down
        - This content is 3 fixed options — it never needs to scroll,
          so BottomSheetView is the right choice here
      */}
      <BottomSheetView style={styles.content}>
        <TouchableOpacity
          style={[styles.option, isOpeningGallery && styles.disabledOption]}
          onPress={openGallery}
          disabled={isOpeningGallery}
        >
          {isOpeningGallery ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesomeIcon icon={Icons.Image} size={24} color="white" />
          )}
          <Text style={styles.text}>{t('pick-from-gallery')}</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={[styles.option, isOpeningCamera && styles.disabledOption]}
          onPress={openCamera}
          disabled={isOpeningCamera}
        >
          {isOpeningCamera ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesomeIcon icon={Icons.Camera} size={24} color="white" />
          )}
          <Text style={styles.text}>{t('take-new-picture')}</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={[styles.option, isDeletingPhoto && styles.disabledOption]}
          onPress={removePicture}
          disabled={isDeletingPhoto}
        >
          {isDeletingPhoto ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesomeIcon icon={Icons.Ban} size={24} color="white" />
          )}
          <Text style={styles.text}>{t('remove-picture')}</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
    backgroundColor: '#434343',
    marginVertical: 5,
  },
  text: {
    color: 'white',
    fontSize: 16,
    flexShrink: 1,
  },
  handleIndicator: {
    backgroundColor: 'white',
    width: '10%',
    margin: 5,
  },
});

export default SlidingView;
