import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetModal } from '@gorhom/bottom-sheet';

const { width } = Dimensions.get('window'); // Get screen width for dynamic sizing

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

  // Dynamically calculate the snap points based on content height

  useEffect(() => {
    if (props.visible) {
      bottomSheetRef.current?.expand(); // Open bottom sheet
    } else {
      bottomSheetRef.current?.close(); // Close bottom sheet
    }
  }, [props.visible]);

  // Function to close BottomSheet when clicking outside
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
          snapPoints={['35%']} // Use dynamic snap points
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
    ...StyleSheet.absoluteFillObject, // Covers the whole screen
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
  },
  option: {
    paddingVertical: 20, // Vertical padding (adjust based on content)
    paddingHorizontal: width * 0.05, // Horizontal padding, 5% of screen width
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seperator: {
    height: 1,
    backgroundColor: '#434343',
    marginVertical: 5, // Give some space between options
  },
  text: {
    color: 'white',
    fontSize: 16, // Base font size
    flexShrink: 1, // Text will shrink if necessary for longer content
  },
});

export default SlidingView;
