import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';

const { height } = Dimensions.get('window'); // Get the screen height

type SlidingViewProps = {
  visible: boolean;
  onClose: () => void;
  openGallery: () => void;
  openCamera: () => void;
  removePicture: () => void;
};

export const SlidingView = (props: SlidingViewProps) => {
  const slideAnim = useRef(new Animated.Value(height)).current; // Start off-screen

  useEffect(() => {
    if (props.visible) {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: 0, // Final position: on-screen
        duration: 300, // Animation duration
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: height, // Move off-screen
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        props.onClose(); // Call onClose after animation completes
      });
    }
  }, [props.visible]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <TouchableOpacity style={styles.option} onPress={props.openGallery}>
        <FontAwesomeIcon icon={Icons.Image} size={24} color={'white'} />
        <Text style={styles.text}>Pick picture from gallery</Text>
      </TouchableOpacity>
      <View style={styles.seperator}></View>
      <TouchableOpacity style={styles.option} onPress={props.openCamera}>
        <FontAwesomeIcon icon={Icons.Camera} size={24} color={'white'} />
        <Text style={styles.text}>Take new picture</Text>
      </TouchableOpacity>
      <View style={styles.seperator}></View>
      <TouchableOpacity style={styles.option} onPress={props.removePicture}>
        <FontAwesomeIcon icon={Icons.Ban} size={24} color={'white'} />
        <Text style={styles.text}>Remove picture</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'grey',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  option: {
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seperator: {
    height: 1,
    backgroundColor: '#434343',
    marginVertical: 1,
  },
  text: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
});

export default SlidingView;
