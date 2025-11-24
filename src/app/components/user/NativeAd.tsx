import React, { useState } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <BannerAd
      unitId={__DEV__ ? TestIds.ADAPTIVE_BANNER : productionID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
      onAdLoaded={() => setIsLoaded(true)}
      onAdFailedToLoad={() => {
        setIsLoaded(true);
      }}
    />
  );
};

export default BannerAdComponent;
