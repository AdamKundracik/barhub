import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { osName } from 'expo-device';

const productionID =
  osName === 'Android'
    ? process.env.EXPO_PUBLIC_ANDROID_ADMOB_BANNER_ID
    : process.env.EXPO_PUBLIC_IOS_ADMOB_BANNER_ID;

const BannerAdComponent = () => {
  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={__DEV__ ? TestIds.ADAPTIVE_BANNER : productionID}
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER} // Big size: 320x100
        requestOptions={{
          requestNonPersonalizedAdsOnly: true, // Optional: Set based on your needs
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default BannerAdComponent;
