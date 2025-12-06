import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';
import {
  OccupancyTypes,
  PlaceType,
} from '@/src/app/utils/types/Feed/PostTypes';
import { Icons } from '@/src/app/utils/icons/icons';

interface MultiSelectPlaceChipsProps {
  onSelectionChange?: (
    selected: PlaceType[],
    occupancy: OccupancyTypes[]
  ) => void;
  initialSelected?: PlaceType[];
  initialOccupancy?: OccupancyTypes[];
}

const PLACE_TYPES: PlaceType[] = [
  'bar',
  'cafe',
  'bakery',
  'casino',
  'night_club',
  'restaurant',
];

const OCCUPANCY_TYPES: OccupancyTypes[] = [
  'FULL',
  'ALMOST_FULL',
  'SPARSELY_OCCUPIED',
  'EMPTY',
];

const MultiSelectPlaceChips: React.FC<MultiSelectPlaceChipsProps> = ({
  onSelectionChange,
  initialSelected = [],
  initialOccupancy = [],
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [selectedPlaces, setSelectedPlaces] =
    useState<PlaceType[]>(initialSelected);
  const [selectedOccupancy, setSelectedOccupancy] =
    useState<OccupancyTypes[]>(initialOccupancy);

  useEffect(() => {
    setSelectedPlaces(initialSelected);
    setSelectedOccupancy(initialOccupancy);
  }, [initialSelected, initialOccupancy]);

  const formatPlaceName = (place: PlaceType): string => {
    switch (place) {
      case 'bar':
        return t('bar');
      case 'cafe':
        return t('cafe');
      case 'bakery':
        return t('bakery');
      case 'casino':
        return t('casino');
      case 'night_club':
        return t('night_club');
      case 'restaurant':
        return t('restaurant');
      default:
        return place;
    }
  };

  const formatOccupancyName = (occupancy: OccupancyTypes): string => {
    switch (occupancy) {
      case 'FULL':
        return t('full');
      case 'ALMOST_FULL':
        return t('almost-full');
      case 'SPARSELY_OCCUPIED':
        return t('sparsely-occupied');
      case 'EMPTY':
        return t('empty');
      default:
        return occupancy;
    }
  };

  const toggleOccupancy = (occupancy: OccupancyTypes): void => {
    const newOccupancySelection = selectedOccupancy.includes(occupancy)
      ? selectedOccupancy.filter(o => o !== occupancy)
      : [...selectedOccupancy, occupancy];

    setSelectedOccupancy(newOccupancySelection);
    onSelectionChange?.(selectedPlaces, newOccupancySelection);
  };

  const togglePlace = (place: PlaceType): void => {
    const newPlaceSelection = selectedPlaces.includes(place)
      ? selectedPlaces.filter(p => p !== place)
      : [...selectedPlaces, place];

    setSelectedPlaces(newPlaceSelection);
    onSelectionChange?.(newPlaceSelection, selectedOccupancy);
  };

  const orderedPlaces = useMemo(() => {
    return [
      ...PLACE_TYPES.filter(place => selectedPlaces.includes(place)),
      ...PLACE_TYPES.filter(place => !selectedPlaces.includes(place)),
    ];
  }, [selectedPlaces]);

  const orderedOccupancy = useMemo(() => {
    return [
      ...OCCUPANCY_TYPES.filter(occ => selectedOccupancy.includes(occ)),
      ...OCCUPANCY_TYPES.filter(occ => !selectedOccupancy.includes(occ)),
    ];
  }, [selectedOccupancy]);

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.sectionTitle, { color: colors.primaryTextColor }]}>
          {t('places-types')}:
        </Text>
        <View style={styles.scrollView}>
          <View style={styles.chipContainer}>
            {orderedPlaces.map(place => {
              const isSelected = selectedPlaces.includes(place);
              return (
                <TouchableOpacity
                  key={place}
                  onPress={() => togglePlace(place)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryColor
                        : colors.primaryTextColor + '1A', // ~10% opacity
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected
                          ? colors.primaryBgColor
                          : colors.primaryTextColor,
                      },
                    ]}
                  >
                    {formatPlaceName(place)}
                  </Text>
                  {isSelected && (
                    <View style={styles.iconContainer}>
                      <FontAwesomeIcon
                        icon={Icons.X}
                        size={10}
                        color={colors.primaryBgColor}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: colors.primaryTextColor }]}>
          {t('occupancy')}:
        </Text>
        <View style={[styles.chipContainer, styles.occupancyContainer]}>
          {orderedOccupancy.map(occupancy => {
            const isSelected = selectedOccupancy.includes(occupancy);
            return (
              <TouchableOpacity
                key={occupancy}
                onPress={() => toggleOccupancy(occupancy)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryColor
                      : colors.primaryTextColor + '1A', // ~10% opacity
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected
                        ? colors.primaryBgColor
                        : colors.primaryTextColor,
                    },
                  ]}
                >
                  {formatOccupancyName(occupancy)}
                </Text>
                {isSelected && (
                  <View style={styles.iconContainer}>
                    <FontAwesomeIcon
                      icon={Icons.X}
                      size={10}
                      color={colors.primaryBgColor}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    gap: 15,
    marginTop: 10,
  },
  scrollView: {
    maxHeight: 200,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  occupancyContainer: {},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor is set inline to use theme colors
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  selectedChip: {
    // backgroundColor is set inline to use theme colors
  },
  sectionTitle: {
    // color is set inline to use theme colors
    marginBottom: 10,
  },
  chipText: {
    // color is set inline to use theme colors
    fontSize: 14,
  },
  selectedChipText: {
    // color is set inline to use theme colors
  },
  iconContainer: {
    marginLeft: 8,
  },
});

export default MultiSelectPlaceChips;
