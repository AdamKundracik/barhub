import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Device from 'react-native-device-info';
import { useTranslation } from 'react-i18next';

import { OccupancyEnum } from '@/src/app/utils/types/Feed/PostTypes';
import { Icons } from '@/src/app/utils/icons/icons';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';

// Types
interface InteractionBarProps {
  likes: number | undefined;
  comments: number | undefined;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShare?: () => void;
  isLiked: boolean | undefined;
  occupancy: string;
  isHighlighted?: boolean;
  isFiltering?: boolean;
}

// Constants
const isTablet = Device.isTablet();
const ICON_SIZE = isTablet ? 30 : 24;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375; // iPhone SE and similar small devices

// Custom hook for occupancy translation
const useOccupancyTranslation = () => {
  const { t } = useTranslation();

  const occupancyLabels = useMemo(
    () => ({
      [OccupancyEnum.FULL]: t('full'),
      [OccupancyEnum.ALMOST_FULL]: t('almost-full'),
      [OccupancyEnum.SPARSELY_OCCUPIED]: t('sparsely-occupied'),
      [OccupancyEnum.EMPTY]: t('empty'),
    }),
    [t]
  );

  const getOccupancyTranslation = (occupancyOption: string): string => {
    if (occupancyOption in occupancyLabels) {
      return occupancyLabels[occupancyOption as keyof typeof occupancyLabels];
    }
    return '';
  };

  return getOccupancyTranslation;
};

// Interaction Button Component
const InteractionButton: React.FC<{
  icon: any;
  count?: number | string;
  color?: string;
  onPress?: () => void;
  isActive?: boolean;
  activeColor?: string;
  isCompact?: boolean;
}> = ({
  icon,
  count,
  color = 'white',
  onPress,
  isActive,
  activeColor = 'red',
  isCompact = false,
}) => {
  const colors = useThemeColors();
  const buttonColor = isActive ? activeColor : color;
  const textStyle = useMemo(
    () => [
      styles.count,
      { color: colors.secondaryTextColor },
      isCompact && compactStyles.count,
    ],
    [isCompact, colors.secondaryTextColor]
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.iconContainer, isCompact && compactStyles.iconContainer]}
      >
        <FontAwesomeIcon icon={icon} size={ICON_SIZE} color={buttonColor} />
        <Text
          style={textStyle}
          numberOfLines={2}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {count}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.iconContainer, isCompact && compactStyles.iconContainer]}
    >
      <FontAwesomeIcon icon={icon} size={ICON_SIZE} color={buttonColor} />
      <Text
        style={textStyle}
        numberOfLines={2}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.7}
      >
        {count}
      </Text>
    </View>
  );
};

// Main component
const InteractionBar: React.FC<InteractionBarProps> = ({
  likes,
  onLikeToggle,
  onShare,
  isLiked,
  occupancy,
  isHighlighted = false,
  isFiltering = false,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const getOccupancyTranslation = useOccupancyTranslation();
  const occupancyText = useMemo(
    () => getOccupancyTranslation(occupancy ?? ''),
    [occupancy, getOccupancyTranslation]
  );

  // Use compact mode when highlighted and filtering (border takes up space)
  // More aggressive on smaller devices
  const isCompact = useMemo(() => {
    if (!isHighlighted || !isFiltering) return false;
    // Always use compact on very small devices, or on devices < 390px when highlighted+filtered
    return isSmallDevice || SCREEN_WIDTH < 390;
  }, [isHighlighted, isFiltering]);

  const containerStyle = useMemo(
    () => [
      styles.container,
      isTablet && tabletStyles.container,
      isCompact && compactStyles.container,
    ],
    [isCompact]
  );

  return (
    <View style={[containerStyle, { backgroundColor: colors.postBgColor }]}>
      {/* Occupancy Display */}
      <InteractionButton
        icon={Icons.Group}
        count={occupancyText}
        color={colors.primaryTextColor}
        isCompact={isCompact}
      />

      {/* Like Button */}
      <InteractionButton
        icon={isLiked ? Icons.HeartSolid : Icons.Heart}
        count={likes}
        color={colors.primaryColor}
        onPress={onLikeToggle}
        isActive={isLiked}
        activeColor="red"
        isCompact={isCompact}
      />

      {/* Commented out Comments Button - keeping for future use */}
      {/*
      <InteractionButton
        icon={Icons.Comment}
        count={comments}
        color={primaryColor}
        onPress={onCommentToggle}
        isCompact={isCompact}
      />
      */}

      {/* Share Button - only show if onShare is provided */}
      {onShare && (
        <InteractionButton
          icon={Icons.Share}
          count={t('share')}
          color={colors.primaryTextColor}
          onPress={onShare}
          isCompact={isCompact}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 15,
    // backgroundColor is set inline to use theme colors
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    minHeight: 50,
    justifyContent: 'center',
  },
  count: {
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 12,
    // color is set inline to use theme colors
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: 14,
    paddingHorizontal: 2,
  },
});

const tabletStyles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  count: {
    marginTop: 8,
    fontSize: 18,
    lineHeight: 22,
  },
});

const compactStyles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingBottom: 12,
  },
  iconContainer: {
    paddingHorizontal: 2,
  },
  count: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 12,
  },
});

export default React.memo(InteractionBar, (prevProps, nextProps) => {
  return (
    prevProps.likes === nextProps.likes &&
    prevProps.comments === nextProps.comments &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.occupancy === nextProps.occupancy &&
    prevProps.onShare === nextProps.onShare &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isFiltering === nextProps.isFiltering
  );
});
