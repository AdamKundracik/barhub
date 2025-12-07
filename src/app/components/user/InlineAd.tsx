import React, { useState, useEffect } from 'react';
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

  // Validate that production ID is set in production builds
  useEffect(() => {
    if (!__DEV__ && !productionID) {
      console.error(
        `[InlineAd] Production AdMob Banner ID is missing for ${osName}. ` +
          `Please set EXPO_PUBLIC_${osName === 'Android' ? 'ANDROID' : 'IOS'}_ADMOB_BANNER_ID environment variable.`
      );
      setHasError(true);
    } else if (!__DEV__ && productionID) {
      console.log(`[InlineAd] Using production AdMob Banner ID for ${osName}`);
    }
  }, []);

  // Determine the unit ID to use
  const getUnitId = () => {
    if (__DEV__) {
      return TestIds.BANNER;
    }
    
    if (!productionID) {
      console.error('[InlineAd] Production ID is undefined, ad will not load');
      return undefined;
    }
    
    return productionID;
  };

  const unitId = getUnitId();

  // Don't render ad if unit ID is invalid
  if (!unitId) {
    return null;
  }

  return (
    <View style={styles.adContainer}>
      {!isAdLoaded && !hasError && (
        <ActivityIndicator size="large" color="white" />
      )}

      {!hasError && (
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log('[InlineAd] Ad loaded successfully');
            setIsAdLoaded(true);
            setHasError(false);
          }}
          onAdFailedToLoad={error => {
            console.error('[InlineAd] Failed to load ad:', {
              error,
              unitId,
              isDev: __DEV__,
              platform: osName,
            });
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
  },
});

export default InlineAd;
