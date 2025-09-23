import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { osName } from 'expo-device';
import { warningColor } from '../../utils/styles/colors';

const iosAdmobBanner = 'ca-app-pub-2698936582690038/3468319444';
const androidAdmobBanner = 'ca-app-pub-2698936582690038/7536391110';
const productionID = osName === 'Android' ? androidAdmobBanner : iosAdmobBanner;

const InlineAd: React.FC = () => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.adContainer}>
      {!isAdLoaded && !hasError && (
        <ActivityIndicator size="large" color="white" />
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ad failed to load</Text>
        </View>
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
            console.error('BannerAd failed to load:', error);
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
    paddingVertical: 10,
    marginTop: 20,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: warningColor,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default InlineAd;
