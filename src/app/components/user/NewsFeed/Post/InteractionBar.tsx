import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
}

// Constants
const isTablet = Device.isTablet();
const ICON_SIZE = isTablet ? 30 : 24;

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
}> = ({
  icon,
  count,
  color = 'white',
  onPress,
  isActive,
  activeColor = 'red',
}) => {
  const buttonColor = isActive ? activeColor : color;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.iconContainer}>
        <FontAwesomeIcon icon={icon} size={ICON_SIZE} color={buttonColor} />
        <Text 
          style={styles.count}
          numberOfLines={2}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {count}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.iconContainer}>
      <FontAwesomeIcon icon={icon} size={ICON_SIZE} color={buttonColor} />
      <Text 
        style={styles.count}
        numberOfLines={2}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {count}
      </Text>
    </View>
  );
};

// Main component
const InteractionBar: React.FC<InteractionBarProps> = ({
  likes,
  comments,
  onLikeToggle,
  onCommentToggle,
  onShare,
  isLiked,
  occupancy,
}) => {
  const { t } = useTranslation();
  const getOccupancyTranslation = useOccupancyTranslation();
  const occupancyText = useMemo(
    () => getOccupancyTranslation(occupancy ?? ''),
    [occupancy, getOccupancyTranslation]
  );

  const containerStyle = useMemo(
    () => [styles.container, isTablet && tabletStyles.container],
    []
  );

  const countStyle = useMemo(
    () => [styles.count, isTablet && tabletStyles.count],
    []
  );

  return (
    <View style={containerStyle}>
      {/* Occupancy Display */}
      <InteractionButton
        icon={Icons.Group}
        count={occupancyText}
        color="white"
      />

      {/* Like Button */}
      <InteractionButton
        icon={isLiked ? Icons.HeartSolid : Icons.Heart}
        count={likes}
        color={primaryColor}
        onPress={onLikeToggle}
        isActive={isLiked}
        activeColor="red"
      />

      {/* Commented out Comments Button - keeping for future use */}
      {/*
      <InteractionButton
        icon={Icons.Comment}
        count={comments}
        color={primaryColor}
        onPress={onCommentToggle}
      />
      */}

      {/* Share Button - only show if onShare is provided */}
      {onShare && (
        <InteractionButton
          icon={Icons.Share}
          count={t('share')}
          color="white"
          onPress={onShare}
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
  },
  count: {
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: 14,
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

export default React.memo(InteractionBar, (prevProps, nextProps) => {
  return (
    prevProps.likes === nextProps.likes &&
    prevProps.comments === nextProps.comments &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.occupancy === nextProps.occupancy &&
    prevProps.onShare === nextProps.onShare
  );
});
