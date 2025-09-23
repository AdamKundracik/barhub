import React, { useCallback, useEffect, useRef } from 'react';
import {
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

const { width } = Dimensions.get('window');

type SlidingViewProps = {
  visible: boolean;
  onClose: () => void;
  openGallery: () => void;
  openCamera: () => void;
  removePicture: () => void;
};

export const SlidingView = ({
  visible,
  onClose,
  openGallery,
  openCamera,
  removePicture,
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
      snapPoints={['40%']}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      handleHeight={50}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.option} onPress={openGallery}>
          <FontAwesomeIcon icon={Icons.Image} size={24} color={'white'} />
          <Text style={styles.text}>{t('pick-from-gallery')}</Text>
        </TouchableOpacity>
        <View style={styles.separator}></View>
        <TouchableOpacity style={styles.option} onPress={openCamera}>
          <FontAwesomeIcon icon={Icons.Camera} size={24} color={'white'} />
          <Text style={styles.text}>{t('take-new-picture')}</Text>
        </TouchableOpacity>
        <View style={styles.separator}></View>
        <TouchableOpacity style={styles.option} onPress={removePicture}>
          <FontAwesomeIcon icon={Icons.Ban} size={24} color={'white'} />
          <Text style={styles.text}>{t('remove-picture')}</Text>
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
  footerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SlidingView;
