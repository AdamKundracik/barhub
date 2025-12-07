import React, { useState, useEffect } from 'react';
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
  const [hasError, setHasError] = useState(false);

  // Validate that production ID is set in production builds
  useEffect(() => {
    if (!__DEV__ && !productionID) {
      console.error(
        `[NativeAd] Production AdMob Banner ID is missing for ${osName}. ` +
          `Please set EXPO_PUBLIC_${osName === 'Android' ? 'ANDROID' : 'IOS'}_ADMOB_BANNER_ID environment variable.`
      );
      setHasError(true);
    } else if (!__DEV__ && productionID) {
      console.log(`[NativeAd] Using production AdMob Banner ID for ${osName}`);
    }
  }, []);

  // Determine the unit ID to use
  const getUnitId = () => {
    if (__DEV__) {
      return TestIds.ADAPTIVE_BANNER;
    }
    
    if (!productionID) {
      console.error('[NativeAd] Production ID is undefined, ad will not load');
      return undefined;
    }
    
    return productionID;
  };

  const unitId = getUnitId();

  // Don't render ad if unit ID is invalid
  if (!unitId || hasError) {
    return null;
  }

  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
      onAdLoaded={() => {
        console.log('[NativeAd] Ad loaded successfully');
        setIsLoaded(true);
        setHasError(false);
      }}
      onAdFailedToLoad={error => {
        console.error('[NativeAd] Failed to load ad:', {
          error,
          unitId,
          isDev: __DEV__,
          platform: osName,
        });
        setHasError(true);
        setIsLoaded(true);
      }}
    />
  );
};

export default BannerAdComponent;
