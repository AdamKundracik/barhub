import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { BannerAd, TestIds } from 'react-native-google-mobile-ads';
import { osName } from 'expo-device'; // Import Device
import { warningColor } from '../../utils/styles/colors';
import Device from 'react-native-device-info';

const width = Dimensions.get('window').width;
const isTablet = Device.isTablet();

const iosAdmobBanner = 'ca-app-pub-2698936582690038/3468319444';
const androidAdmobBanner = 'ca-app-pub-2698936582690038/7536391110';
const productionID = osName === 'Android' ? androidAdmobBanner : iosAdmobBanner;

const InlineAd = () => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.adContainer}>
      {!isAdLoaded ? <ActivityIndicator size="large" color={'white'} /> : null}
      <View>
        <Text style={{ color: 'white' }}>Google Ad</Text>
      </View>

      <BannerAd
        unitId={__DEV__ ? TestIds.BANNER : productionID}
        size={`${width}x${width}`} // Dynamic size based on width
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setIsAdLoaded(true);
          setHasError(false);
        }}
        onAdFailedToLoad={e => {
          console.error(e);
          setHasError(true);
          setIsAdLoaded(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 50,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: warningColor,
    borderRadius: 10,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default InlineAd;
