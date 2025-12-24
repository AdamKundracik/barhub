import { Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import {
  primaryLightGrey,
  separatorColor,
  warningColor,
  primaryColor,
  primaryBgColor,
  primaryTextColor,
  primaryDeepColor,
} from '../../../../utils/styles/colors';
import Svg, { Path } from 'react-native-svg';
import { commonAppStyles } from '../../../../utils/styles/styles';
import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlaceStore } from '../../../../utils/store/placesStore';
import { useRequestStore } from '../../../../utils/store/requestStore';

type Props = {
  requestPhoto: () => void;
};

const PostOldInfo = (props: Props) => {
  const { t } = useTranslation();
  const { placeId } = usePlaceStore();
  const { addRequest, canRequest } = useRequestStore();
  const isDisabled = !canRequest(placeId ?? '');
  
  // Animation for subtle entrance effect
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handlePress = () => {
    if (isDisabled) return;
    props.requestPhoto();
    addRequest(placeId ?? '');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Icon container with improved positioning */}
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Svg width="20" height="24" viewBox="0 0 27 32" fill="none">
            <Path
              d="M2.87654 27.0479H6.86814C7.09219 28.435 7.76005 29.6919 8.75424 30.5977C9.74844 31.5034 11.0053 32 12.3037 32C13.6021 32 14.859 31.5034 15.8532 30.5977C16.8474 29.6919 17.5152 28.435 17.7393 27.0479H21.7309C22.0932 27.0643 22.455 27.0031 22.7955 26.8678C23.1361 26.7326 23.4487 26.5259 23.7156 26.2596C23.9825 25.9933 24.1984 25.6726 24.351 25.3158C24.5036 24.9591 24.5899 24.5732 24.605 24.1802C24.6201 23.7872 24.5637 23.3949 24.439 23.0256C24.3143 22.6562 24.1237 22.3172 23.8782 22.0277C23.6327 21.7383 23.337 21.5041 23.008 21.3386C22.679 21.1731 22.3232 21.0795 21.9608 21.0631V19.5121C23.6683 18.808 25.0944 17.4776 25.9918 15.752C26.8891 14.0264 27.2009 12.0145 26.8731 10.0656C26.5452 8.11667 25.5985 6.35377 24.1971 5.08295C22.7958 3.81214 21.0283 3.11365 19.2017 3.10875C18.0902 3.11066 16.9922 3.37264 15.9826 3.8768C15.9546 2.81862 15.5401 1.81587 14.8303 1.08914C14.1205 0.36241 13.1737 -0.0287721 12.198 0.00165051C11.2222 0.0320731 10.2976 0.481609 9.62755 1.25136C8.95746 2.02112 8.59677 3.04804 8.62482 4.10622V4.40546C6.85503 5.19198 5.34129 6.53226 4.27659 8.25543C3.21188 9.97859 2.64444 12.0066 2.64661 14.0809V21.0631C1.91483 21.0962 1.22513 21.4432 0.729247 22.0277C0.233362 22.6123 -0.0280942 23.3866 0.00239659 24.1802C0.0328874 24.9738 0.352827 25.7218 0.891833 26.2596C1.43084 26.7974 2.14476 27.081 2.87654 27.0479ZM19.2017 5.10368C20.384 5.10368 21.5399 5.48394 22.523 6.19635C23.5061 6.90877 24.2723 7.92136 24.7248 9.10607C25.1773 10.2908 25.2957 11.5944 25.065 12.8521C24.8343 14.1098 24.265 15.265 23.4289 16.1717C22.5928 17.0785 21.5276 17.696 20.3679 17.9461C19.2083 18.1963 18.0063 18.0679 16.9139 17.5772C15.8215 17.0865 14.8878 16.2555 14.231 15.1893C13.5741 14.123 13.2234 12.8695 13.2234 11.5872C13.2234 9.86767 13.8533 8.21856 14.9744 7.00266C16.0956 5.78677 17.6161 5.10368 19.2017 5.10368ZM12.3037 2.11129C12.7419 2.11286 13.1652 2.28403 13.4974 2.59399C13.8295 2.90394 14.0488 3.33232 14.1156 3.80199C12.9182 3.55756 11.6893 3.55756 10.4919 3.80199C10.5587 3.33232 10.7779 2.90394 11.1101 2.59399C11.4422 2.28403 11.8655 2.11286 12.3037 2.11129ZM15.8677 27.0479C15.6619 27.9017 15.2009 28.6575 14.5569 29.1969C13.9128 29.7363 13.122 30.0289 12.3083 30.0289C11.4946 30.0289 10.7038 29.7363 10.0598 29.1969C9.41573 28.6575 8.95475 27.9017 8.74898 27.0479H15.8677Z"
              fill={warningColor}
            />
            <Path
              d="M18.8704 12.5193L22.4343 14.0155L23.0965 12.1502L20.1212 10.9034V6.10059H18.2817V11.5866C18.2814 11.7884 18.3374 11.9856 18.4425 12.1521C18.5476 12.3186 18.6968 12.4466 18.8704 12.5193Z"
              fill={warningColor}
            />
          </Svg>
        </View>
      </View>

      {/* Content section */}
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>{t('older-photo-info')}</Text>
        <Text style={styles.subtitleText}>
          {t('request-photo-info')}
        </Text>
      </View>

      {/* Enhanced button */}
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          isDisabled && styles.buttonDisabled,
          pressed && !isDisabled && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('request-photo')}
        accessibilityHint={isDisabled ? "Button is disabled" : "Tap to request a new photo"}
      >
        {({ pressed }) => (
          <Text
            style={[
              styles.buttonText,
              isDisabled && styles.buttonTextDisabled,
              pressed && !isDisabled && styles.buttonTextPressed,
            ]}
          >
            {t('request-photo')}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: primaryBgColor,
    borderWidth: 1.5,
    borderColor: `${warningColor}40`, // 25% opacity
    padding: 16,
    shadowColor: warningColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${warningColor}20`, // 12% opacity
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${warningColor}60`, // 37% opacity
  },
  contentContainer: {
    marginBottom: 14,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  subtitleText: {
    fontSize: 13,
    color: primaryLightGrey,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9,
  },
  button: {
    backgroundColor: `${warningColor}15`, // 8% opacity
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: warningColor,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    shadowColor: warningColor,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonPressed: {
    backgroundColor: warningColor,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: `${separatorColor}10`, // 6% opacity
    borderColor: separatorColor,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: warningColor,
    textAlign: 'center',
  },
  buttonTextPressed: {
    color: primaryBgColor,
  },
  buttonTextDisabled: {
    color: separatorColor,
    opacity: 0.6,
  },
});

export default React.memo(PostOldInfo);
