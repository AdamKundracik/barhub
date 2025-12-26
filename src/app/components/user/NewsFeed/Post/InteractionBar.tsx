import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Device from 'react-native-device-info';
import { useTranslation } from 'react-i18next';

import { OccupancyEnum } from '@/src/app/utils/types/Feed/PostTypes';
import { Icons } from '@/src/app/utils/icons/icons';
import { postBgColor, primaryColor } from '@/src/app/utils/styles/colors';

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
  onLikeLongPress?: () => void;
  showCommentButton?: boolean; // Optional prop to hide comment button
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
  onLongPress?: () => void;
  isActive?: boolean;
  activeColor?: string;
  isCompact?: boolean;
  buttonKey?: string;
}> = React.memo(({
  icon,
  count,
  color = 'white',
  onPress,
  onLongPress,
  isActive,
  activeColor = 'red',
  isCompact = false,
  buttonKey,
}) => {
  const buttonColor = isActive ? activeColor : color;
  
  // useMemo needed to maintain referential equality for FlashList optimization
  const textStyle = useMemo(
    () => [styles.count, isCompact && compactStyles.count],
    [isCompact]
  );

  // Create a unique key for the text wrapper to force re-render when content changes
  // This ensures adjustsFontSizeToFit recalculates correctly when content changes
  const textKey = `text-wrapper-${buttonKey}-${count}-${isCompact}`;
  const textContent = String(count ?? '');

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        onLongPress={onLongPress}
        style={[styles.iconContainer, isCompact && compactStyles.iconContainer]}
      >
        <FontAwesomeIcon icon={icon} size={ICON_SIZE} color={buttonColor} />
        <View key={textKey}>
          <Text 
            style={textStyle}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {textContent}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.iconContainer, isCompact && compactStyles.iconContainer]}>
      <FontAwesomeIcon icon={icon} size={ICON_SIZE} color={buttonColor} />
      <View key={textKey}>
        <Text 
          style={textStyle}
          numberOfLines={2}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {textContent}
        </Text>
      </View>
    </View>
  );
});

// Main component
const InteractionBar: React.FC<InteractionBarProps> = ({
  likes,
  comments,
  onLikeToggle,
  onCommentToggle,
  onShare,
  isLiked,
  occupancy,
  isHighlighted = false,
  isFiltering = false,
  onLikeLongPress,
  showCommentButton = true, // Default to true for backward compatibility
}) => {
  const { t } = useTranslation();
  const getOccupancyTranslation = useOccupancyTranslation();
  const occupancyText = getOccupancyTranslation(occupancy ?? '');

  // Use compact mode when highlighted and filtering (border takes up space)
  // More aggressive on smaller devices
  const isCompact = isHighlighted && isFiltering && (isSmallDevice || SCREEN_WIDTH < 390);

  // useMemo needed to maintain referential equality for FlashList optimization
  const containerStyle = useMemo(
    () => [
      styles.container,
      isTablet && tabletStyles.container,
      isCompact && compactStyles.container,
    ],
    [isCompact]
  );

  return (
    <View style={containerStyle}>
      {/* Occupancy Display */}
      <InteractionButton
        key="occupancy"
        buttonKey="occupancy"
        icon={Icons.Group}
        count={occupancyText}
        color="white"
        isCompact={isCompact}
      />

      {/* Like Button */}
      <InteractionButton
        key="likes"
        buttonKey="likes"
        icon={isLiked ? Icons.HeartSolid : Icons.Heart}
        count={likes}
        color={primaryColor}
        onPress={onLikeToggle}
        onLongPress={onLikeLongPress}
        isActive={isLiked}
        activeColor="red"
        isCompact={isCompact}
      />

      {/* Comments Button - only show if showCommentButton is true */}
      {showCommentButton && (
        <InteractionButton
          key="comments"
          buttonKey="comments"
          icon={Icons.Comment}
          count={comments}
          color={primaryColor}
          onPress={onCommentToggle}
          isCompact={isCompact}
        />
      )}

      {/* Share Button - only show if onShare is provided */}
      {onShare && (
        <InteractionButton
          key="share"
          buttonKey="share"
          icon={Icons.Share}
          count={t('share')}
          color="white"
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
    backgroundColor: postBgColor,
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
    color: '#a0a0a0',
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
    prevProps.onLikeToggle === nextProps.onLikeToggle &&
    prevProps.onCommentToggle === nextProps.onCommentToggle &&
    prevProps.onLikeLongPress === nextProps.onLikeLongPress &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isFiltering === nextProps.isFiltering
  );
});
