import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNetwork } from '../../providers/NetworkProvider';
import { useTranslation } from 'react-i18next';
import { Icons } from '../../utils/icons/icons';

export const NetworkTopBar: React.FC = () => {
  const { isConnected, isLoading } = useNetwork();
  const { t } = useTranslation();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isConnected && !isVisible) {
      // Show the bar
      setIsVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (isConnected && isVisible) {
      // Hide the bar
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [isConnected, isLoading, isVisible, slideAnim]);

  if (isLoading || isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <FontAwesomeIcon
          icon={Icons.Warning}
          size={16}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Text style={styles.text}>
          {t('no_internet_connection', 'No internet connection')}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626', // Red color for error
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 25, // Account for status bar
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
