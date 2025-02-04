import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetModal } from '@gorhom/bottom-sheet';

const { width } = Dimensions.get('window');

type SlidingViewProps = {
  visible: boolean;
  onClose: () => void;
  openGallery: () => void;
  openCamera: () => void;
  removePicture: () => void;
};

export const SlidingView = (props: SlidingViewProps) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (props.visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [props.visible]);

  const handleCloseOnClickOutside = () => {
    props.onClose();
  };

  return (
    props.visible && (
      <>
        <TouchableWithoutFeedback onPress={handleCloseOnClickOutside}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={['35%']}
          onClose={props.onClose}
          backgroundStyle={{ backgroundColor: 'grey' }}
          handleHeight={50}
          enablePanDownToClose
        >
          <TouchableOpacity style={styles.option} onPress={props.openGallery}>
            <FontAwesomeIcon icon={Icons.Image} size={24} color={'white'} />
            <Text style={styles.text}>{t('pick-from-gallery')}</Text>
          </TouchableOpacity>
          <View style={styles.seperator}></View>
          <TouchableOpacity style={styles.option} onPress={props.openCamera}>
            <FontAwesomeIcon icon={Icons.Camera} size={24} color={'white'} />
            <Text style={styles.text}>{t('take-new-picture')}</Text>
          </TouchableOpacity>
          <View style={styles.seperator}></View>
          <TouchableOpacity style={styles.option} onPress={props.removePicture}>
            <FontAwesomeIcon icon={Icons.Ban} size={24} color={'white'} />
            <Text style={styles.text}>{t('remove-picture')}</Text>
          </TouchableOpacity>
        </BottomSheet>
      </>
    )
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  option: {
    paddingVertical: 20,
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seperator: {
    height: 1,
    backgroundColor: '#434343',
    marginVertical: 5,
  },
  text: {
    color: 'white',
    fontSize: 16,
    flexShrink: 1,
  },
});

export default SlidingView;
