import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { primaryColor } from '../../../../utils/styles/colors';
import Slider from '@react-native-community/slider';
import MultiSelectPlaceChips from './MultiSelectPlaceChips';
import Button from '../../../shared/Button';
import { OccupancyTypes, PlaceType } from '../../../../utils/types/types';
import { useFiltersStore } from '../../../../utils/store/filtersStorage';

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave?: (filters: {
    distance: number;
    placeTypes: string[];
    occupancyTypes: string[];
  }) => void;
};

export const PLACE_TYPES: PlaceType[] = [
  'bar',
  'cafe',
  'bakery',
  'casino',
  'night_club',
  'restaurant',
];

export const OCCUPANCY_TYPES: OccupancyTypes[] = [
  'FULL',
  'ALMOST_FULL',
  'SPARSELY_OCCUPIED',
  'EMPTY',
];

const FilterSlider = (props: Props) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const {
    distance: storeDistance,
    selectedPlaces: storeSelectedPlaces,
    selectedOccupancy: storeSelectedOccupancy,
    updateFilters,
  } = useFiltersStore();
  const [tempDistance, setTempDistance] = useState(storeDistance);
  const [tempSelectedPlaces, setTempSelectedPlaces] = useState<PlaceType[]>(
    storeSelectedPlaces.length > 0 ? storeSelectedPlaces : PLACE_TYPES
  );
  const [tempSelectedOccupancy, setTempSelectedOccupancy] = useState<
    OccupancyTypes[]
  >(
    storeSelectedOccupancy.length > 0 ? storeSelectedOccupancy : OCCUPANCY_TYPES
  );

  useEffect(() => {
    if (props.opened) {
      setTempDistance(storeDistance);
      setTempSelectedPlaces(
        storeSelectedPlaces.length > 0 ? storeSelectedPlaces : PLACE_TYPES
      );
      setTempSelectedOccupancy(
        storeSelectedOccupancy.length > 0
          ? storeSelectedOccupancy
          : OCCUPANCY_TYPES
      );
    }
  }, [props.opened]);

  const handleSaveChanges = useCallback(() => {
    // if (tempSelectedPlaces.length === 0) {
    //   Alert.alert(
    //     t('error'),
    //     t('please-select-place'),
    //     [{ text: t('ok'), style: 'default' }],
    //     { cancelable: true }
    //   );
    //   return;
    // }

    const finalPlaces =
      tempSelectedPlaces.length === 0 ? [...PLACE_TYPES] : tempSelectedPlaces;

    const finalOccupancy =
      tempSelectedOccupancy.length === 0
        ? [...OCCUPANCY_TYPES]
        : tempSelectedOccupancy;

    updateFilters({
      distance: tempDistance,
      placeTypes: finalPlaces,
      occupancy: finalOccupancy,
    });

    props.onSave?.({
      distance: tempDistance,
      placeTypes: finalPlaces,
      occupancyTypes: finalOccupancy,
    });
    bottomSheetRef?.current?.close();
    props.onClose();
  }, [
    tempDistance,
    tempSelectedPlaces,
    updateFilters,
    tempSelectedOccupancy,
    props.onSave,
    t,
  ]);

  const handleSelectionChange = useCallback(
    (places: PlaceType[], occupancy: OccupancyTypes[]) => {
      setTempSelectedPlaces(places);
      setTempSelectedOccupancy(occupancy);
    },
    []
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={20}>
        <View style={styles.footerContainer}>
          <Button
            color={primaryColor}
            text={t('save-changes')}
            clickFuntion={handleSaveChanges}
          />
        </View>
      </BottomSheetFooter>
    ),
    [handleSaveChanges]
  );

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClose={props.onClose}
      ref={bottomSheetRef}
      snapPoints={['90%', '70%']}
      index={props.opened ? 1 : -1}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      handleHeight={60}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: 'white', width: '10%' }}
      handleStyle={{ padding: 10 }}
    >
      <View style={styles.content}>
        <View>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>
            {t('filters')}
          </Text>
        </View>
        <View style={styles.section}>
          <View style={styles.distanceHeader}>
            <Text style={styles.sectionTitle}>{t('distance')}</Text>
            <Text style={styles.distanceText}>{tempDistance} km</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumTrackTintColor={primaryColor}
            value={tempDistance}
            minimumValue={1}
            maximumValue={30}
            onValueChange={value => setTempDistance(Number(value.toFixed(0)))}
          />
        </View>

        <View style={styles.section}>
          <MultiSelectPlaceChips
            onSelectionChange={handleSelectionChange}
            initialSelected={tempSelectedPlaces}
            initialOccupancy={tempSelectedOccupancy}
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  section: {
    marginVertical: 10,
  },
  distanceHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: 'white',
    marginBottom: 10,
  },
  slider: {
    paddingVertical: 30,
  },
  distanceText: {
    color: 'white',
  },
  footerContainer: {
    display: 'flex',
    alignSelf: 'center',
    padding: 12,
    margin: 12,
  },
});
export default FilterSlider;
