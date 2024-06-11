import {
  Animated,
  Dimensions,
  Modal as ModalReactNative,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { EvilIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type ModalProps = {
  children: ReactNode | ReactNode[];
  isOpen: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const screenHeight = Dimensions.get('window').height;

export const Modal = ({
                        isOpen,
                        onClose,
                        children,
                        showCloseButton = true,
                      }: ModalProps) => {
  const [isWrapperModalOpen, setIsWrapperModalOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  useEffect(() => {
    setIsWrapperModalOpen(isOpen);
  }, [isOpen]);

  const handleCloseWrapperModal = () => {
    onClose();
    setTimeout(() => setIsWrapperModalOpen(false), 500);
  };

  return (
    <ModalReactNative
      visible={isWrapperModalOpen}
      onRequestClose={handleCloseWrapperModal}
      transparent
    >
      <>
        <ModalReactNative
          visible={isOpen}
          onRequestClose={handleCloseWrapperModal}
          animationType={'slide'}
          transparent
        >
          <Animated.View
            style={[{ opacity: opacityValue }, StyleSheet.absoluteFill]}
          >
            <AnimatedBlurView intensity={10} style={StyleSheet.absoluteFill}/>
          </Animated.View>
          <TouchableOpacity style={styles.backdrop} onPress={onClose}/>
          <View
            style={[
              styles.content,
              { transform: [{ translateY: height * -0.5 }] },
            ]}
            onLayout={({
                         nativeEvent: {
                           layout: { height },
                         },
                       }) => setHeight(height)}
          >
            {showCloseButton && (
              <EvilIcons
                name="close"
                size={40}
                style={styles.closeButton}
                color="gray"
                onPress={onClose}
              />
            )}
            <ScrollView
              style={styles.scrollWrapper}
              showsVerticalScrollIndicator
              alwaysBounceVertical={false}
            >
              {children}
            </ScrollView>
          </View>
        </ModalReactNative>
      </>
    </ModalReactNative>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  content: {
    backgroundColor: '#fff',
    flex: 1,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    zIndex: 20,
    left: 20,
    right: 20,
    top: '50%',
    minHeight: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 21,
  },
  scrollWrapper: {
    padding: 20,
    maxHeight: screenHeight * 0.8,
  },
});
