import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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

const InlineAd: React.FC = () => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.adContainer}>
      {!isAdLoaded && !hasError && (
        <ActivityIndicator size="large" color="white" />
      )}

      {!hasError && (
        <BannerAd
          unitId={__DEV__ ? TestIds.BANNER : productionID}
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setIsAdLoaded(true);
            setHasError(false);
          }}
          onAdFailedToLoad={error => {
            console.error('InlineAd failed to load:', error);
            setHasError(true);
            setIsAdLoaded(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default InlineAd;
