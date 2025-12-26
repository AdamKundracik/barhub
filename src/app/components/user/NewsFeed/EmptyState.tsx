import React from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCamera, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import {
  primaryColor,
  primaryTextColor,
  separatorColor,
} from '../../../utils/styles/colors';
import RequestPhotoButton from './RequestPhotoButton';
import { usePlaceStore } from '../../../utils/store/placesStore';
import InlineAd from '../InlineAd';
import { useUserData } from '../../../hooks/useUserQuery';
import { PremiumHelpers } from '../../../config/premiumConfig';

const { width: screenWidth } = Dimensions.get('window');

interface EmptyStateProps {
  requestPhoto: () => void;
}

const EmptyState = (props: EmptyStateProps) => {
  const { t } = useTranslation();
  const { placeId } = usePlaceStore();
  const { isPremium } = useUserData();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  if (!placeId) {
    return (
      <>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[primaryColor + '20', primaryColor + '10']}
              style={styles.iconBackground}
            >
              <FontAwesomeIcon icon={faCamera} size={48} color={primaryColor} />
            </LinearGradient>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>{t('no-feed-photos')}</Text>
            <Text style={styles.subtitle}>{t('explore-places-subtitle')}</Text>
          </View>

          <View style={styles.decorativeElements}>
            <View
              style={[styles.dot, { backgroundColor: primaryColor + '40' }]}
            />
            <View
              style={[styles.dot, { backgroundColor: primaryColor + '60' }]}
            />
            <View style={[styles.dot, { backgroundColor: primaryColor }]} />
          </View>

          {(PremiumHelpers.shouldAlwaysShowAds() || !isPremium) && (
            <View style={styles.inlineAdContainer}>
              <InlineAd />
            </View>
          )}
        </Animated.View>
      </>
    );
  }

  return (
    <>
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[primaryColor + '20', primaryColor + '10']}
            style={styles.iconBackground}
          >
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              size={48}
              color={primaryColor}
            />
          </LinearGradient>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>{t('photos-info')}</Text>
          <Text style={styles.subtitle}>{t('first-to-share-subtitle')}</Text>
        </View>

        <View style={styles.actionContainer}>
          <RequestPhotoButton requestPhoto={props.requestPhoto} />
          <Text style={styles.helpText}>{t('request-photo-info')}</Text>
        </View>

        {(PremiumHelpers.shouldAlwaysShowAds() || !isPremium) && (
          <View style={styles.inlineAdContainer}>
            <InlineAd />
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    // paddingTop: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: primaryColor + '30',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: screenWidth - 64,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: separatorColor,
    textAlign: 'center',
    lineHeight: 22,
    marginHorizontal: 20,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  helpText: {
    fontSize: 14,
    color: separatorColor,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
    marginHorizontal: 24,
    opacity: 0.8,
  },
  decorativeElements: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  inlineAdContainer: {
    marginTop: 32,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
});

export default React.memo(EmptyState);
