import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export const Loading = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse (scale up/down

    // Floating up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Gradient line background */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 397 860"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#CC2ECC" />
            <Stop offset="50%" stopColor="#FF4E8A" />
            <Stop offset="100%" stopColor="#FF9A5C" />
          </LinearGradient>
          <LinearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF9A5C" />
            <Stop offset="50%" stopColor="#FF4E8A" />
            <Stop offset="100%" stopColor="#CC2ECC" />
          </LinearGradient>
        </Defs>

        {/* Top-left arc */}
        <Path
          d="M -30 220 Q 150 250 300 -30"
          stroke="url(#grad1)"
          strokeWidth={40}
          strokeLinecap="round"
          fill="none"
        />

        {/* Bottom-right arc */}
        <Path
          d="M 100 890 Q 250 610 430 640"
          stroke="url(#grad2)"
          strokeWidth={40}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* Floating text SVG */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '60%',
          width: '100%',
          alignItems: 'center',
          transform: [{ translateY: floatAnim }],
        }}
      >
        <Image
          source={require('../../../../assets/logo.png')}
          style={{ width: 233, height: 134, resizeMode: 'contain' }}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
