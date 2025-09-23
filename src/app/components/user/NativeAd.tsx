import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// Define the props interface
interface BannerAdComponentProps {
  adUnitId?: string; // Optional Ad Unit ID or TestIds.BANNER
}

// Define the component
const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ adUnitId }) => {
  const [adUnit, setAdUnit] = useState<string>(
    adUnitId || TestIds.ADAPTIVE_BANNER
  );

  useEffect(() => {
    setAdUnit(adUnitId || TestIds.ADAPTIVE_BANNER);
  }, [adUnitId]);

  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={adUnit}
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
