import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../utils/icons/icons';
import { PlaceType } from '../../../../utils/types/types';
import { useTranslation } from 'react-i18next';

interface MultiSelectPlaceChipsProps {
  onSelectionChange?: (selected: PlaceType[]) => void;
  initialSelected?: PlaceType[];
}

const PLACE_TYPES: PlaceType[] = [
  'bar',
  'cafe',
  'bakery',
  'casino',
  'night_club',
  'restaurant',
];

const MultiSelectPlaceChips: React.FC<MultiSelectPlaceChipsProps> = ({
  onSelectionChange,
  initialSelected = [],
}) => {
  const { t } = useTranslation();

  const [selectedPlaces, setSelectedPlaces] =
    useState<PlaceType[]>(initialSelected);

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

  const togglePlace = (place: PlaceType): void => {
    const newSelection = selectedPlaces.includes(place)
      ? selectedPlaces.filter(p => p !== place)
      : [...selectedPlaces, place];

    setSelectedPlaces(newSelection);
    onSelectionChange?.(newSelection);
  };

  // Order places with selected items first
  const orderedPlaces: PlaceType[] = useMemo(() => {
    return [
      ...PLACE_TYPES.filter(place => selectedPlaces.includes(place)),
      ...PLACE_TYPES.filter(place => !selectedPlaces.includes(place)),
    ];
  }, [selectedPlaces]);

  return (
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
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
