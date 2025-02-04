import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../utils/icons/icons';
import { OccupancyTypes, PlaceType } from '../../../../utils/types/types';
import { useTranslation } from 'react-i18next';

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
        <Text style={styles.sectionTitle}>{t('places-types')}:</Text>
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={styles.chipContainer}>
            {orderedPlaces.map(place => {
              const isSelected = selectedPlaces.includes(place);
              return (
                <TouchableOpacity
                  key={place}
                  onPress={() => togglePlace(place)}
                  style={[styles.chip, isSelected && styles.selectedChip]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.selectedChipText,
                    ]}
                  >
                    {formatPlaceName(place)}
                  </Text>
                  {isSelected && (
                    <View style={styles.iconContainer}>
                      <FontAwesomeIcon icon={Icons.X} size={10} color="black" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View>
        <Text style={styles.sectionTitle}>{t('occupancy')}:</Text>
        <View style={[styles.chipContainer, styles.occupancyContainer]}>
          {orderedOccupancy.map(occupancy => {
            const isSelected = selectedOccupancy.includes(occupancy);
            return (
              <TouchableOpacity
                key={occupancy}
                onPress={() => toggleOccupancy(occupancy)}
                style={[styles.chip, isSelected && styles.selectedChip]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.selectedChipText,
                  ]}
                >
                  {formatOccupancyName(occupancy)}
                </Text>
                {isSelected && (
                  <View style={styles.iconContainer}>
                    <FontAwesomeIcon icon={Icons.X} size={10} color="black" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#10D9B9',
  },
  sectionTitle: {
    color: 'white',
    marginBottom: 10,
  },
  chipText: {
    color: 'white',
    fontSize: 14,
  },
  selectedChipText: {
    color: 'black',
  },
  iconContainer: {
    marginLeft: 8,
  },
});

export default MultiSelectPlaceChips;
